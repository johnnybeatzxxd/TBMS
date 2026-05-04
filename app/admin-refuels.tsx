import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, SectionList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { refuelService, driverService } from "@/src/api/services";
import { Refuel } from "@/src/types/refuel.types";
import { DateFilterBar, DateFilterPreset, passesDateFilter } from "@/src/components/DateFilterBar";

const getRelativeDateLabel = (dateStr: string) => {
  // normalize timestamps to just date
  const cleanStr = dateStr.split("T")[0];
  const [year, month, day] = cleanStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return cleanStr;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const RefuelCard = ({ exp, onApprove, driverName }: { exp: Refuel, onApprove: (id: string) => void, driverName?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setIsExpanded(!isExpanded)}
      className="bg-white p-4 rounded-2xl mb-3 border border-border shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-2">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 border ${exp.approved === "APPROVED" ? "bg-success-50 border-success-100" : "bg-sky-50 border-sky-100"}`}>
            <Ionicons name="water" size={18} color={exp.approved === "APPROVED" ? "#16A34A" : "#0EA5E9"} />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
              Fuel Refill
            </Text>
            <Text className="text-text-secondary text-xs">
              Truck: {exp.truckId} • {exp.liters}L
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className={`font-bold text-lg ${exp.approved === "APPROVED" ? "text-success-600" : "text-sky-600"}`}>
            ${typeof exp.price === "number" ? exp.price.toFixed(2) : exp.price}
          </Text>
          <View className="flex-row items-center mt-1">
             <Text className={`text-[10px] font-bold uppercase tracking-wider mr-2 px-2 py-0.5 rounded ${exp.approved === "APPROVED" ? "bg-success-100 text-success-700" : "bg-sky-100 text-sky-700"}`}>
               {exp.approved || "PENDING"}
             </Text>
             <Ionicons 
               name={isExpanded ? "chevron-up" : "chevron-down"} 
               size={16} 
               color="#94A3B8" 
             />
          </View>
        </View>
      </View>
      
      {isExpanded && (
        <View className="mt-3 pt-3 border-t border-border/50">
          <View className="bg-surface rounded-xl p-3 border border-border/30 mb-2 gap-2">
            <View className="flex-row items-center justify-between">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Driver</Text>
               <Text className="text-text-primary text-sm font-medium">{driverName || exp.driverId || "N/A"}</Text>
            </View>
            
            {exp.location && (
               <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
                  <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Location</Text>
                  <Text className="text-text-primary text-sm font-medium">{exp.location}</Text>
               </View>
            )}
            
            {exp.km !== undefined && (
               <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
                  <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Odometer</Text>
                  <Text className="text-text-primary text-sm font-medium">{exp.km} km</Text>
               </View>
            )}
            
            <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Tank Fill</Text>
               <View className={`px-2 py-0.5 rounded ${exp.fullTank ? "bg-success-100" : "bg-surface border border-border"}`}>
                 <Text className={`text-[10px] font-bold uppercase tracking-wider ${exp.fullTank ? "text-success-700" : "text-text-secondary"}`}>
                   {exp.fullTank ? "Full Tank" : "Partial"}
                 </Text>
               </View>
            </View>
          </View>

          {exp.approved !== "APPROVED" && (
            <View className="flex-row justify-end pt-1">
               <TouchableOpacity
                 className="px-6 py-2 bg-success-500 rounded-lg flex-row items-center"
                 activeOpacity={0.8}
                 onPress={(e) => { e.stopPropagation(); onApprove(exp._id || (exp as any).id); }}
               >
                 <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{marginRight: 4}} />
                 <Text className="text-white font-bold text-sm">Approve Form</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function RefuelsScreen() {
  const { user } = useAuthStore();
  const [displayedRefuels, setDisplayedRefuels] = useState<Refuel[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [driverMap, setDriverMap] = useState<Record<string, string>>({});

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const loadInitialData = async () => {
    setLoadingInitial(true);
    setPage(1);
    try {
      const res = await refuelService.getRefuels({
         page: 1,
         perpage: 10,
         startDate: filterPreset !== "all" && customFrom ? customFrom.toISOString().split("T")[0] : undefined,
         endDate: filterPreset !== "all" && customTo ? customTo.toISOString().split("T")[0] : undefined,
      });
      setDisplayedRefuels(res.refuels || []);
      setHasMore(res.meta?.currentPage < res.meta?.totalPages);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load refuels");
      setHasMore(false);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await refuelService.getRefuels({
         page: nextPage,
         perpage: 10,
         startDate: filterPreset !== "all" && customFrom ? customFrom.toISOString().split("T")[0] : undefined,
         endDate: filterPreset !== "all" && customTo ? customTo.toISOString().split("T")[0] : undefined,
      });
      
      const newItems = (res.refuels || []).filter(item => !displayedRefuels.some(p => (p._id || (p as any).id) === (item._id || (item as any).id)));
      setDisplayedRefuels(prev => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(res.meta?.currentPage < res.meta?.totalPages);
    } catch (error) {
       setHasMore(false); // Fix silent failure endless loop
    }
    setLoadingMore(false);
  };

  const handleApprove = async (id: string) => {
    try {
      await refuelService.approveRefuel(id);
      setDisplayedRefuels(prev => prev.map(r => (r._id || (r as any).id) === id ? { ...r, approved: "APPROVED" } : r));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to approve refuel");
    }
  };

  useEffect(() => {
    loadInitialData();
    const isManager = user?.role === "admin" || (user?.role as string) === "manager";
    if (isManager) {
       driverService.getMyDrivers().then(res => {
         const map: Record<string, string> = {};
         res.drivers.forEach((d: any) => { map[d.id || d._id] = d.name; });
         setDriverMap(map);
       }).catch(() => console.log("Silent fail driver map load"));
    }
  }, []);

  const groupedRefuels = displayedRefuels.reduce((acc, exp) => {
    const rawDate = exp.date ? exp.date.split("T")[0] : new Date().toISOString().split("T")[0];
    if (!acc[rawDate]) acc[rawDate] = [];
    acc[rawDate].push(exp);
    return acc;
  }, {} as Record<string, typeof displayedRefuels>);

  const refuelGroups = Object.entries(groupedRefuels).map(([date, exps]) => ({
    dateStr: date,
    title: getRelativeDateLabel(date),
    data: exps,
  }));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center rounded-full bg-slate-100">
            <Ionicons name="arrow-back" size={20} color="#64748B" />
          </TouchableOpacity>
          <Ionicons name="water" size={26} color="#0EA5E9" />
          <Text className="text-text-primary font-bold text-xl tracking-wide">
            Refuels
          </Text>
        </View>
      </View>

      <DateFilterBar
        activePreset={filterPreset}
        onPresetChange={(preset) => {
          setFilterPreset(preset);
          if (preset === "all") {
            setCustomFrom(null);
            setCustomTo(null);
            loadInitialData();
          }
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      <SectionList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />}
        sections={refuelGroups}
        keyExtractor={(item, index) => (item._id || (item as any).id) + index}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-5 mb-2 mt-6">
            {title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="px-4">
            <RefuelCard exp={item} onApprove={handleApprove} driverName={driverMap[item.driverId]} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6 items-center flex-row justify-center gap-2">
              <ActivityIndicator size="small" color="#0EA5E9" />
              <Text className="text-text-secondary text-sm font-medium tracking-wide">Loading more refuels...</Text>
            </View>
          ) : !hasMore && displayedRefuels.length > 0 ? (
            <View className="py-6 items-center">
              <Text className="text-text-secondary/50 text-xs tracking-wide">End of refuel logs</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loadingInitial ? (
            <View className="py-20 items-center justify-center opacity-60">
              <Ionicons name="water-outline" size={64} color="#94A3B8" />
              <Text className="text-text-secondary text-base mt-4 text-center">
                No refuels found matching filters.
              </Text>
            </View>
          ) : (
            <View className="py-20 items-center justify-center gap-3">
               <ActivityIndicator size="large" color="#0EA5E9" />
               <Text className="text-text-secondary tracking-widest uppercase text-xs font-bold">Loading refuels...</Text>
            </View>
          )
        }
      />

      <TouchableOpacity
        onPress={() => router.push("/add-refuel")}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-sky-500 rounded-full items-center justify-center shadow-lg border border-sky-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
