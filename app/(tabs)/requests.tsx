import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, SectionList, ActivityIndicator, Dimensions, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/src/store";
import { DateFilterBar, DateFilterPreset } from "@/src/components/DateFilterBar";
import { mockRequestsService } from "@/src/api/mock/requests.mock";
import { ServiceRequest, RequestStatus } from "@/src/types/request.types";
import { mockTruckService } from "@/src/api/mock/trucks.mock";

const getRelativeDateLabel = (dateStr: string) => {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return "Invalid Date";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const formatCurrency = (n?: number) => n ? n.toLocaleString("en-US") : "0";

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  switch (status) {
    case "accepted":
      return (
        <View className="bg-success-100 px-2 py-0.5 rounded flex-row items-center gap-1 border border-success-200">
          <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
          <Text className="text-success-700 text-[10px] font-bold uppercase tracking-wider">Accepted</Text>
        </View>
      );
    case "declined":
      return (
        <View className="bg-danger-100 px-2 py-0.5 rounded flex-row items-center gap-1 border border-danger-200">
          <Ionicons name="close-circle" size={12} color="#DC2626" />
          <Text className="text-danger-700 text-[10px] font-bold uppercase tracking-wider">Declined</Text>
        </View>
      );
    default:
      return (
        <View className="bg-amber-100 px-2 py-0.5 rounded flex-row items-center gap-1 border border-amber-200">
          <Ionicons name="time" size={12} color="#D97706" />
          <Text className="text-amber-700 text-[10px] font-bold uppercase tracking-wider">Pending</Text>
        </View>
      );
  }
};

const RequestCard = ({ req, isManager, onStatusUpdate }: { req: ServiceRequest, isManager: boolean, onStatusUpdate: (id: string, status: RequestStatus) => void }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm"
    >
      {/* Title / Type Row */}
      <View className="flex-row items-center justify-between p-4 bg-white">
        <View className="flex-row items-center flex-1 pr-4">
          <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center mr-3">
            <MaterialCommunityIcons name="clipboard-list-outline" size={20} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-0.5">
              {req.truckId.replace("trk_", "Truck ")}
            </Text>
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
              {req.type}
            </Text>
          </View>
        </View>
        <StatusBadge status={req.status} />
      </View>

      {/* Expanded Actions & Info */}
      {expanded && (
        <View className="px-4 pb-4 bg-surface/50 border-t border-border pt-4 gap-4">
          <View>
             <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase">Description</Text>
             <Text className="text-text-primary text-sm mt-1">{req.description}</Text>
          </View>

          {req.amount ? (
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase">Requested Amount</Text>
              <Text className="text-text-primary font-bold text-lg mt-0.5 text-danger-600">${formatCurrency(req.amount)}</Text>
            </View>
          ) : null}

          {/* Manager Actions */}
          {isManager && req.status === "pending" && (
            <View className="flex-row gap-3 mt-2 border-t border-border pt-4">
              <TouchableOpacity
                className="flex-1 bg-success-500 py-2.5 rounded-xl items-center"
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation();
                  onStatusUpdate(req.id, "accepted");
                }}
              >
                <Text className="text-white font-bold text-sm">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[0.7] bg-white border border-danger-500 py-2.5 rounded-xl items-center"
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation();
                  onStatusUpdate(req.id, "declined");
                }}
              >
                <Text className="text-danger-600 font-bold text-sm">Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-center justify-between border-t border-border pt-3 mt-1">
            <Text className="text-text-secondary text-xs">Generated on: {new Date(req.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function RequestsScreen() {
  const { user } = useAuthStore();
  const isManager = user?.role === "manager" || user?.role === "admin";
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [trucks, setTrucks] = useState<any[]>([{ id: "all", plateNumber: "All Trucks" }]);
  const [selectedTruck, setSelectedTruck] = useState<any>({ id: "all", plateNumber: "All Trucks" });
  const [showTruckMenu, setShowTruckMenu] = useState(false);

  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  useEffect(() => {
    if (isManager) {
      (async () => {
        const res = await mockTruckService.getMyTrucks();
        if ("trucks" in res) {
          setTrucks([{ id: "all", plateNumber: "All Trucks" }, ...res.trucks]);
        }
      })();
    }
  }, [isManager]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const res = await mockRequestsService.getRequests({
      preset: filterPreset,
      customFrom,
      customTo,
      truckId: selectedTruck.id,
      role: user?.role as any,
      driverId: user?.id,
    });
    setRequests(res.requests);
    setLoading(false);
  }, [filterPreset, customFrom, customTo, selectedTruck, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [loadRequests]);

  useFocusEffect(
    useCallback(() => {
      const { useAuthStore } = require("@/src/store/authStore");
      if (!useAuthStore.getState().isAuthenticated) return;
      loadRequests();
    }, [loadRequests])
  );

  const handleStatusUpdate = async (id: string, status: RequestStatus) => {
    // Optimistic UI update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    await mockRequestsService.updateStatus(id, status);
  };

  const groupedData = useMemo(() => {
    const grouped = requests.reduce((acc, req) => {
      if (!acc[req.date]) acc[req.date] = [];
      acc[req.date].push(req);
      return acc;
    }, {} as Record<string, ServiceRequest[]>);

    return Object.entries(grouped)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, reqs]) => ({
        dateStr: date,
        title: getRelativeDateLabel(date),
        data: reqs,
      }));
  }, [requests]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="bg-primary z-50 elevation-10 shadow-sm relative pt-4 pb-20 px-5 rounded-b-[40px]">
        {/* Title Row */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-2xl font-bold tracking-wide">Requests</Text>
            <Text className="text-white/70 text-sm mt-0.5">
              {isManager ? "Manage driver requests" : "Track your requests"}
            </Text>
          </View>
          
          {isManager && (
            <View className="relative z-50">
              <TouchableOpacity
                onPress={() => setShowTruckMenu(!showTruckMenu)}
                className="flex-row items-center bg-white/20 border border-white/30 rounded-full px-4 py-2 gap-2"
                activeOpacity={0.8}
              >
                <Ionicons name="car-sport" size={16} color="#fff" />
                <Text className="text-white font-medium text-sm">{selectedTruck.plateNumber}</Text>
                <Ionicons name={showTruckMenu ? "chevron-up" : "chevron-down"} size={16} color="#fff" />
              </TouchableOpacity>
              
              {showTruckMenu && (
                <View className="absolute right-0 top-12 bg-white rounded-2xl border border-border shadow-lg overflow-hidden min-w-[200px] z-[999] elevation-20">
                  <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                    {trucks.map((truck) => (
                      <TouchableOpacity
                        key={truck.id}
                        onPress={() => {
                          setSelectedTruck(truck);
                          setShowTruckMenu(false);
                        }}
                        className={`px-4 py-3 border-b border-border/50 flex-row items-center gap-3 ${
                          selectedTruck.id === truck.id ? "bg-primary-50" : "bg-white"
                        }`}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={truck.id === "all" ? "apps-outline" : "car-sport-outline"} 
                          size={18} 
                          color={selectedTruck.id === truck.id ? "#2563EB" : "#64748B"} 
                        />
                        <Text className={`text-sm ${selectedTruck.id === truck.id ? "text-primary font-bold" : "text-text-primary"}`}>
                          {truck.plateNumber}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Stats Summary Bubble */}
        <View className="absolute -bottom-8 left-5 right-5 bg-white rounded-3xl border border-border shadow-sm p-4 flex-row justify-between items-center z-10">
          <View className="items-center flex-1">
            <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Total</Text>
            <Text className="text-text-primary font-black text-xl">{requests.length}</Text>
          </View>
          <View className="w-px h-8 bg-border" />
          <View className="items-center flex-1">
            <Text className="text-amber-500 text-[10px] font-bold tracking-widest uppercase mb-1">Pending</Text>
            <Text className="text-text-primary font-black text-xl">{requests.filter(r => r.status === "pending").length}</Text>
          </View>
          <View className="w-px h-8 bg-border" />
          <View className="items-center flex-1">
            <Text className="text-success-500 text-[10px] font-bold tracking-widest uppercase mb-1">Accepted</Text>
            <Text className="text-text-primary font-black text-xl">{requests.filter(r => r.status === "accepted").length}</Text>
          </View>
        </View>
      </View>

      {/* Date Filters Spacer & Bar */}
      <View className="mt-12 z-0 elevation-0">
        <DateFilterBar
          activePreset={filterPreset}
          onPresetChange={setFilterPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
      </View>

      {loading && requests.length === 0 ? (
         <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563EB" />
         </View>
      ) : (
        <SectionList
          className="flex-1 px-4 z-0 elevation-0"
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
          sections={groupedData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-10 mt-10">
              <View className="w-20 h-20 bg-primary-50 rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="clipboard-check-outline" size={40} color="#2563EB" opacity={0.5} />
              </View>
              <Text className="text-text-primary font-bold text-lg mb-2">No Requests Found</Text>
              <Text className="text-text-secondary text-center px-6">
                 No service requests match the selected filters. Tap the + icon below to create one.
              </Text>
            </View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <View className="mt-6 mb-2 flex-row items-center gap-3">
              <Text className="text-text-primary font-bold text-sm tracking-wide">{title}</Text>
              <View className="flex-1 h-px bg-border/80" />
            </View>
          )}
          renderItem={({ item }) => (
            <RequestCard req={item} isManager={isManager} onStatusUpdate={handleStatusUpdate} />
          )}
        />
      )}

      {/* Add Request FAB - Only for Drivers */}
      {!isManager && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/add-request")}
          className="absolute bottom-6 right-6 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-lg border-4 border-white z-50 elevation-10"
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
