import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { DateFilterBar, DateFilterPreset, passesDateFilter } from "@/src/components/DateFilterBar";
import { tripService, truckService } from "@/src/api/services";
import { Trip, Truck, GetTripsQuery } from "@/src/types";

const ALL_TRUCKS_MOCK: Truck = { id: "all", plateNumber: "All Trucks", adminId: "" };

const getRelativeDateLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const getGroupedTrips = (trips: Trip[]) => {
  const grouped = trips.reduce((acc, trip) => {
    // Group by simplified date string
    const dStr = new Date(trip.date).toLocaleDateString("en-US");
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  return Object.entries(grouped).map(([date, t]) => ({
    dateStr: date,
    title: getRelativeDateLabel(date),
    data: t,
  }));
};

const TripCard = ({ trip, isManager, onRefresh }: { trip: Trip, isManager: boolean, onRefresh: () => void }) => {
  const [expanded, setExpanded] = useState(false);

  const handleApprove = async () => {
    try {
      await tripService.approveTrip(trip.id);
      Alert.alert("Success", "Cash trip approved successfully!");
      onRefresh();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Approval failed.");
    }
  };

  const formattedDate = new Date(trip.date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm"
    >
      {/* ALWAYS VISIBLE: Unloading Site */}
      <View className="flex-row items-center justify-between p-4 bg-white">
        <View className="flex-row items-center flex-1 pr-4">
          <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center mr-3">
            <Ionicons name="location" size={20} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-0.5">
              Destination
            </Text>
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
              {trip.destinationSite}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#94A3B8"
        />
      </View>

      {/* EXPANDED CONTENT: Date, Loading Site, Payment Method */}
      {expanded && (
        <View className="relative px-4 pb-4 bg-surface/50 border-t border-border pt-3 gap-3">
          {/* Edit Action - top right */}
          {isManager && (
            <View className="absolute top-3 right-4 z-10 flex-row gap-2">
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  const qs = `?id=${trip.id}&date=${encodeURIComponent(formattedDate)}&loadingSite=${encodeURIComponent(trip.loadingSite)}&unloadingSite=${encodeURIComponent(trip.destinationSite)}&paymentMethod=${trip.paymentMethod.toLowerCase()}&cashAmount=${trip.amount || ""}&volume=${trip.volume}`;
                  router.push(`/add-trip${qs}`);
                }}
                className="w-8 h-8 bg-primary-50 rounded-lg items-center justify-center border border-primary-100"
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={14} color="#2563EB" />
              </TouchableOpacity>
            </View>
          )}

          {/* Timeline Connector Graphic */}
          <View className="relative pl-2 pb-1">
            {/* Dot & Line container */}
            <View className="absolute left-4 top-2 bottom-6 w-px bg-border items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-primary-100 absolute -top-1" />
              <View className="w-2 h-2 rounded-full border border-primary bg-white absolute -bottom-1" />
            </View>

            <View className="ml-8 gap-4">
              <View>
                <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                  Loading Site
                </Text>
                <Text className="text-text-primary text-sm font-medium mt-0.5">
                  {trip.loadingSite}
                </Text>
              </View>

              <View>
                <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                  Trip Date
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Ionicons name="calendar-outline" size={12} color="#64748B" />
                  <Text className="text-text-primary text-sm font-medium ml-1">
                    {formattedDate}
                  </Text>
                </View>
              </View>

              <View>
                <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                  Volume
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Ionicons name="cube-outline" size={12} color="#64748B" />
                  <Text className="text-text-primary text-sm font-medium ml-1">
                    {trip.volume.replace("MCUBE", " M³")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Method Badge */}
          <View className="flex-row items-center justify-between mt-1 pt-3 border-t border-border/50">
            <View className="flex-row items-center">
              <Text className="text-text-secondary text-xs uppercase font-medium tracking-wider mr-2">
                Payment
              </Text>
              <View
                className={`px-2.5 py-1 rounded-md ${
                  trip.paymentMethod === "CASH" ? "bg-success-50" : "bg-primary-50"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    trip.paymentMethod === "CASH" ? "text-success-600" : "text-primary-600"
                  }`}
                >
                  {trip.paymentMethod}
                </Text>
              </View>
            </View>

            {trip.amount !== undefined && (
              <View className="flex-row items-center">
                <Text className="text-text-secondary text-xs uppercase font-medium tracking-wider mr-1">
                  Amount:
                </Text>
                <Text className="text-success-700 font-bold text-sm">
                  ${trip.amount}
                </Text>
              </View>
            )}

            {isManager && trip.paymentMethod === "CREDIT" && (
              <View
                className={`px-3 py-1.5 rounded-lg border ${trip.claimed ? 'bg-success-50 border-success-200' : 'bg-surface border-border'}`}
              >
                <Text className={`font-bold text-xs uppercase tracking-wider ${trip.claimed ? 'text-success-700' : 'text-text-secondary'}`}>
                  {trip.claimed ? 'Claimed' : 'Unclaimed'}
                </Text>
              </View>
            )}

            {isManager && trip.paymentMethod === "CASH" && trip.approved === "PENDING" && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  Alert.alert("Approve Trip", "Are you sure you want to approve this cash amount?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Approve", onPress: handleApprove }
                  ]);
                }}
                className="px-3 py-1.5 rounded-lg border bg-amber-50 border-amber-200"
              >
                <Text className="font-bold text-xs uppercase tracking-wider text-amber-700">
                  Approve Needs
                </Text>
              </TouchableOpacity>
            )}
            
            {isManager && trip.paymentMethod === "CASH" && trip.approved !== "PENDING" && (
              <View className={`px-3 py-1.5 rounded-lg border ${trip.approved === "APPROVED" ? 'bg-success-50 border-success-200' : 'bg-red-50 border-red-200'}`}>
                <Text className={`font-bold text-xs uppercase tracking-wider ${trip.approved === "APPROVED" ? 'text-success-700' : 'text-red-700'}`}>
                  {trip.approved}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function TripsListScreen() {
  const { user } = useAuthStore();
  const isManager = user?.role === "admin" || user?.role === "manager";
  const [showTruckMenu, setShowTruckMenu] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>([ALL_TRUCKS_MOCK]);
  const [selectedTruck, setSelectedTruck] = useState<Truck>(ALL_TRUCKS_MOCK);

  // Trip Pagination State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  // Advanced Filter Modal State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  
  const [paymentFilter, setPaymentFilter] = useState<"All" | "CASH" | "CREDIT">("All");
  const [claimFilter, setClaimFilter] = useState<"All" | "Claimed" | "Unclaimed">("All");

  const buildQuery = (pageNumber: number): GetTripsQuery => {
    let query: GetTripsQuery = {
      page: pageNumber,
      perpage: 10,
    };

    if (isManager && selectedTruck.id !== "all") {
      query.truckId = selectedTruck.id;
    }

    if (paymentFilter !== "All") {
      query.paymentMethod = paymentFilter;
      
      if (paymentFilter === "CREDIT" && claimFilter !== "All") {
        query.claimed = claimFilter === "Claimed";
      }
    }

    if (customFrom) {
      query.startDate = customFrom.toISOString();
    }
    if (customTo) {
      query.endDate = customTo.toISOString();
    }

    return query;
  };

  const loadTrips = useCallback(async (pageNumber: number, append = false) => {
    if (pageNumber === 1) setLoadingInitial(true);
    else setLoadingMore(true);

    try {
      const res = await tripService.getTrips(buildQuery(pageNumber));
      setTrips(prev => append ? [...prev, ...res.data] : res.data);
      setPage(res.meta.currentPage);
      setTotalPages(res.meta.totalPages);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load trips");
    } finally {
      if (pageNumber === 1) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  }, [selectedTruck, paymentFilter, claimFilter, customFrom, customTo, isManager]);

  useEffect(() => {
    loadTrips(1);
  }, [loadTrips]);

  const handleLoadMore = () => {
    if (!loadingMore && !loadingInitial && page < totalPages) {
      loadTrips(page + 1, true);
    }
  };

  const tripGroups = getGroupedTrips(trips);

  useEffect(() => {
    if (isManager) {
      // Still using mock trucks to populate list, should also switch to real service eventually if needed
      truckService.getMyTrucks().then((res) => {
        if ("trucks" in res) {
          setTrucks([ALL_TRUCKS_MOCK, ...res.trucks]);
        }
      });
    }
  }, [isManager]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-border shadow-sm bg-white" style={{ zIndex: 50, elevation: 10 }}>
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="truck" size={26} color="#2563EB" />
          <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide">Trips</Text>
        </View>
        {isManager && (
          <View className="relative">
            <TouchableOpacity
              onPress={() => setShowTruckMenu((v) => !v)}
              className="flex-row items-center gap-1.5 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2"
              activeOpacity={0.8}
            >
              <Ionicons name="car-sport" size={14} color="#2563EB" />
              <Text className="text-primary font-semibold text-sm">{selectedTruck.plateNumber}</Text>
              <Ionicons name={showTruckMenu ? "chevron-up" : "chevron-down"} size={14} color="#2563EB" />
            </TouchableOpacity>

            {showTruckMenu && (
              <View className="absolute right-0 top-10 bg-white rounded-2xl border border-border shadow-lg overflow-hidden min-w-[160px]" style={{ zIndex: 999, elevation: 20 }}>
                {trucks.map((truck) => (
                  <TouchableOpacity
                    key={truck.id}
                    onPress={() => {
                      setSelectedTruck(truck);
                      setShowTruckMenu(false);
                    }}
                    className={`px-4 py-3 flex-row items-center gap-2 ${
                      selectedTruck.id === truck.id ? "bg-primary-50" : "bg-white"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={truck.id === "all" ? "apps-outline" : "car-sport-outline"}
                      size={16}
                      color={selectedTruck.id === truck.id ? "#2563EB" : "#64748B"}
                    />
                    <Text
                      className={`text-sm font-medium ${
                        selectedTruck.id === truck.id ? "text-primary font-bold" : "text-text-primary"
                      }`}
                    >
                      {truck.plateNumber}
                    </Text>
                    {selectedTruck.id === truck.id && (
                      <Ionicons name="checkmark" size={14} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Filter Section */}
      <View className="bg-white flex-row items-center border-b border-border shadow-sm" style={{ zIndex: 1, elevation: 0 }}>
        <View className="flex-1">
          <DateFilterBar
            activePreset={filterPreset}
            onPresetChange={(preset) => {
              setFilterPreset(preset);
              if (preset === "all") {
                setPaymentFilter("All");
                setClaimFilter("All");
                setCustomFrom(null);
                setCustomTo(null);
              } else if (preset !== "custom") {
                // If they click 'Today' or '7d', DateFilterBar inherently gives us range but we need to track if we apply it to custom dates
                // However DateFilterBar doesn't export the underlying range immediately, so customFrom/customTo stay null and we might need logic inside passesDateFilter.
                // For a fully network backed approach, we need exact Date bounds from presets.
                // Here we just map known sets:
                const end = new Date();
                const start = new Date();
                if (preset === "today") start.setHours(0,0,0,0);
                if (preset === "7d") start.setDate(end.getDate() - 7);
                if (preset === "30d") start.setDate(end.getDate() - 30);
                setCustomFrom(start);
                setCustomTo(end);
              }
            }}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
            hideCustomDateRow={true}
          />
        </View>
        <TouchableOpacity 
          onPress={() => {
            setFilterPreset("custom"); // Automatically switch to custom if opening Advanced Modal
            setShowAdvancedFilters(true);
          }}
          className="w-10 h-10 bg-primary-50 rounded-lg items-center justify-center border border-primary-100 mr-4"
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Advanced Filter Modal */}
      <Modal visible={showAdvancedFilters} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-border shadow-2xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-border/50">
              <Text className="text-text-primary font-bold text-lg">Advanced Filters</Text>
              <TouchableOpacity onPress={() => setShowAdvancedFilters(false)} className="w-8 h-8 bg-surface rounded-full items-center justify-center">
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View className="px-5 py-4 gap-5">
              {/* Date Range Section */}
              <View>
                <Text className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Custom Date Range</Text>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setShowFromPicker(true)}
                    className="flex-1 flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border"
                  >
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text className="ml-2 text-sm text-text-primary">
                      {customFrom ? `${customFrom.getMonth() + 1}/${customFrom.getDate()}` : "Start Date"}
                    </Text>
                  </TouchableOpacity>

                  <Ionicons name="arrow-forward" size={14} color="#94A3B8" />

                  <TouchableOpacity
                    onPress={() => setShowToPicker(true)}
                    className="flex-1 flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border"
                  >
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text className="ml-2 text-sm text-text-primary">
                      {customTo ? `${customTo.getMonth() + 1}/${customTo.getDate()}` : "End Date"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Payment Method Section */}
              <View>
                <Text className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Payment Method</Text>
                <View className="flex-row gap-2">
                  {["All", "CASH", "CREDIT"].map(method => (
                    <TouchableOpacity 
                      key={method}
                      onPress={() => setPaymentFilter(method as any)}
                      className={`px-3 py-1.5 rounded-full border ${paymentFilter === method ? "bg-primary border-primary" : "bg-surface border-border"}`}
                    >
                      <Text className={`text-xs font-semibold ${paymentFilter === method ? "text-white" : "text-text-secondary"}`}>{method}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Claim Status Section */}
              {isManager && paymentFilter === "CREDIT" && (
                <View>
                  <Text className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Claim Status</Text>
                  <View className="flex-row gap-2">
                    {["All", "Claimed", "Unclaimed"].map(status => (
                      <TouchableOpacity 
                        key={status}
                        onPress={() => setClaimFilter(status as any)}
                        className={`px-3 py-1.5 rounded-full border ${claimFilter === status ? "bg-primary border-primary" : "bg-surface border-border"}`}
                      >
                        <Text className={`text-xs font-semibold ${claimFilter === status ? "text-white" : "text-text-secondary"}`}>{status}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Footer */}
            <View className="p-5 border-t border-border/50 bg-surface flex-row gap-3">
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  setPaymentFilter("All");
                  setClaimFilter("All");
                  setFilterPreset("all");
                  setCustomFrom(null);
                  setCustomTo(null);
                }}
                className="flex-1 bg-white border border-border rounded-xl items-center justify-center py-3"
              >
                <Text className="text-text-secondary font-bold text-sm tracking-wide">Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  setShowAdvancedFilters(false);
                  loadTrips(1); // Force immediate execute of new filters map
                }}
                className="flex-1 bg-primary rounded-xl items-center justify-center py-3 shadow-sm border border-primary-600"
              >
                <Text className="text-white font-bold text-sm tracking-wide">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Date Pickers */}
        {showFromPicker && (
          <DateTimePicker
            value={customFrom || new Date()}
            mode="date"
            display="default"
            onChange={(_, d) => {
              setShowFromPicker(false);
              if (d) setCustomFrom(d);
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={customTo || new Date()}
            mode="date"
            display="default"
            onChange={(_, d) => {
              setShowToPicker(false);
              if (d) setCustomTo(d);
            }}
          />
        )}
      </Modal>

      <SectionList
        sections={tripGroups}
        keyExtractor={(item, index) => item.id + index}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1 mt-6">
            {title}
          </Text>
        )}
        renderItem={({ item }) => (
          <TripCard trip={item} isManager={isManager} onRefresh={() => loadTrips(1)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6 items-center flex-row justify-center gap-2">
              <ActivityIndicator size="small" color="#2563EB" />
              <Text className="text-text-secondary text-sm font-medium tracking-wide">Loading more trips...</Text>
            </View>
          ) : page >= totalPages && trips.length > 0 ? (
            <View className="py-6 items-center">
              <Text className="text-text-secondary/50 text-xs tracking-wide">No more trips to show</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loadingInitial ? (
            <View className="py-20 items-center justify-center">
               <Text className="text-text-secondary">No trips found matching filters.</Text>
            </View>
          ) : (
            <View className="py-20 items-center justify-center gap-3">
               <ActivityIndicator size="large" color="#2563EB" />
               <Text className="text-text-secondary tracking-widest uppercase text-xs font-bold">Loading trips...</Text>
            </View>
          )
        }
      />

      {/* Floating Action Button (Alternative Add Button) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/add-trip")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg border border-primary-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
