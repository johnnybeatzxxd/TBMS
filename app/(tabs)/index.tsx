import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { DateFilterBar, DateFilterPreset, passesDateFilter } from "@/src/components/DateFilterBar";

const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

// Dummy data for trips
const MOCK_TRIPS = [
  // Today
  { id: "1", date: getPastDateStr(0), loadingSite: "4kilo", unloadingSite: "Moria", paymentMethod: "Dispatch", volume: "10MCUBE", claimed: false },
  { id: "2", date: getPastDateStr(0), loadingSite: "Bole", unloadingSite: "Dukem", paymentMethod: "Cash", cashAmount: "850.00", volume: "16MCUBE" },
  { id: "3", date: getPastDateStr(0), loadingSite: "Bole airport", unloadingSite: "Kality", paymentMethod: "Dispatch", volume: "16MCUBE", claimed: true },
  { id: "3a", date: getPastDateStr(0), loadingSite: "Saris", unloadingSite: "Mexico", paymentMethod: "Cash", cashAmount: "1200.00", volume: "10MCUBE" },
  
  // Yesterday
  { id: "4", date: getPastDateStr(1), loadingSite: "Entoto", unloadingSite: "Sendafa", paymentMethod: "Cash", cashAmount: "450.00", volume: "10MCUBE" },
  { id: "5", date: getPastDateStr(1), loadingSite: "Bole", unloadingSite: "Moria", paymentMethod: "Dispatch", volume: "16MCUBE", claimed: false },
  { id: "6", date: getPastDateStr(1), loadingSite: "4kilo", unloadingSite: "Dukem", paymentMethod: "Cash", cashAmount: "300.00", volume: "10MCUBE" },
  { id: "6a", date: getPastDateStr(1), loadingSite: "Ayat", unloadingSite: "Summit", paymentMethod: "Dispatch", volume: "16MCUBE", claimed: false },

  // 2 days ago
  { id: "7", date: getPastDateStr(2), loadingSite: "Entoto", unloadingSite: "Kality", paymentMethod: "Dispatch", volume: "16MCUBE", claimed: true },
  { id: "8", date: getPastDateStr(2), loadingSite: "Bole airport", unloadingSite: "Sendafa", paymentMethod: "Cash", cashAmount: "550.00", volume: "10MCUBE" },
  { id: "9", date: getPastDateStr(2), loadingSite: "4kilo", unloadingSite: "Moria", paymentMethod: "Dispatch", volume: "16MCUBE", claimed: false },
  { id: "9a", date: getPastDateStr(2), loadingSite: "Piazza", unloadingSite: "Hosaena", paymentMethod: "Cash", cashAmount: "1500.00", volume: "10MCUBE" },
  
  // 3+ days ago
  { id: "10", date: getPastDateStr(3), loadingSite: "Bole", unloadingSite: "Dukem", paymentMethod: "Dispatch", volume: "10MCUBE", claimed: true },
  { id: "10a", date: getPastDateStr(3), loadingSite: "Jemo", unloadingSite: "Lebu", paymentMethod: "Cash", cashAmount: "700.00", volume: "16MCUBE" },
  { id: "11", date: getPastDateStr(4), loadingSite: "Entoto", unloadingSite: "Kality", paymentMethod: "Cash", cashAmount: "900.00", volume: "16MCUBE" },
  { id: "11a", date: getPastDateStr(4), loadingSite: "Old Airport", unloadingSite: "Bisrate Gabriel", paymentMethod: "Dispatch", volume: "10MCUBE", claimed: false },
  { id: "12", date: getPastDateStr(5), loadingSite: "Bole airport", unloadingSite: "Sendafa", paymentMethod: "Dispatch", volume: "10MCUBE", claimed: false },
  { id: "13", date: getPastDateStr(6), loadingSite: "Megenagna", unloadingSite: "CMC", paymentMethod: "Cash", cashAmount: "500.00", volume: "16MCUBE" },
  { id: "14", date: getPastDateStr(7), loadingSite: "Bambis", unloadingSite: "Kazanchis", paymentMethod: "Dispatch", volume: "10MCUBE", claimed: true },
  { id: "15", date: getPastDateStr(8), loadingSite: "Tor Hailoch", unloadingSite: "Ayer Tena", paymentMethod: "Cash", cashAmount: "600.00", volume: "16MCUBE" },
  { id: "16", date: getPastDateStr(9), loadingSite: "Gerji", unloadingSite: "Jackros", paymentMethod: "Dispatch", volume: "10MCUBE", claimed: false },
  { id: "17", date: getPastDateStr(10), loadingSite: "Gurd Shola", unloadingSite: "Summit", paymentMethod: "Cash", cashAmount: "800.00", volume: "16MCUBE" },
  { id: "18", date: getPastDateStr(11), loadingSite: "Kotebe", unloadingSite: "Kara", paymentMethod: "Dispatch", volume: "10MCUBE", claimed: false },
];



import { mockTruckService } from "@/src/api/mock/trucks.mock";
import { Truck } from "@/src/types";

const ALL_TRUCKS_MOCK: Truck = { id: "all", plateNumber: "All Trucks", adminId: "" };

const getRelativeDateLabel = (dateStr: string) => {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;
  
  const d = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
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

// We will handle grouping dynamically inside the component instead of globally
const getGroupedTrips = (trips: typeof MOCK_TRIPS) => {
  const grouped = trips.reduce((acc, trip) => {
    if (!acc[trip.date]) acc[trip.date] = [];
    acc[trip.date].push(trip);
    return acc;
  }, {} as Record<string, typeof MOCK_TRIPS>);

  return Object.entries(grouped).map(([date, t]) => ({
    dateStr: date,
    title: getRelativeDateLabel(date),
    data: t,
  }));
};

const TripCard = ({ trip, onDelete, isManager }: { trip: typeof MOCK_TRIPS[0], onDelete: (id: string) => void, isManager: boolean }) => {

  const [expanded, setExpanded] = useState(false);

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
              {trip.unloadingSite}
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
          {/* Edit & Delete Action icons - top right */}
          {isManager && (
            <View className="absolute top-3 right-4 z-10 flex-row gap-2">

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                Alert.alert("Delete Trip", "Are you sure you want to delete this trip?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => onDelete(trip.id) },
                ]);
              }}
              className="w-8 h-8 bg-danger-50 rounded-lg items-center justify-center border border-danger-100"
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={14} color="#DC2626" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                const qs = `?id=${trip.id}&date=${encodeURIComponent(trip.date)}&loadingSite=${encodeURIComponent(trip.loadingSite)}&unloadingSite=${encodeURIComponent(trip.unloadingSite)}&paymentMethod=${trip.paymentMethod.toLowerCase()}&cashAmount=${trip.cashAmount || ""}&volume=${trip.volume}`;
                router.push(`/add-trip${qs}` as any);
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
                    {trip.date}
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
                    {trip.volume?.replace("MCUBE", " M³")}
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
                  trip.paymentMethod === "Cash" ? "bg-success-50" : "bg-primary-50"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    trip.paymentMethod === "Cash" ? "text-success-600" : "text-primary-600"
                  }`}
                >
                  {trip.paymentMethod}
                </Text>
              </View>
            </View>

            {trip.paymentMethod === "Cash" && trip.cashAmount && (
              <View className="flex-row items-center">
                <Text className="text-text-secondary text-xs uppercase font-medium tracking-wider mr-1">
                  Amount:
                </Text>
                <Text className="text-success-700 font-bold text-sm">
                  ${trip.cashAmount}
                </Text>
              </View>
            )}

            {isManager && trip.paymentMethod === "Dispatch" && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  if (trip.claimed) return;
                  Alert.alert("Claim Dispatch", "Are you sure you want to mark this dispatch as claimed?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Claim", onPress: () => console.log("Claimed trip", trip.id) }
                  ]);
                }}
                className={`px-3 py-1.5 rounded-lg border ${trip.claimed ? 'bg-success-50 border-success-200' : 'bg-primary-50 border-primary-200'}`}
                activeOpacity={trip.claimed ? 1 : 0.7}
              >
                <Text className={`font-bold text-xs uppercase tracking-wider ${trip.claimed ? 'text-success-700' : 'text-primary-700'}`}>
                  {trip.claimed ? 'Claimed' : 'Claim'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function TripsListScreen() {
  const { user } = useAuthStore();
  const isManager = user?.role === "manager";
  const [showTruckMenu, setShowTruckMenu] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>([ALL_TRUCKS_MOCK]);
  const [selectedTruck, setSelectedTruck] = useState<Truck>(ALL_TRUCKS_MOCK);

  // Trip Pagination State
  const [trips, setTrips] = useState<typeof MOCK_TRIPS>([]);
  const [page, setPage] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchTripsPage = async (pageNumber: number) => {
    // Simulated API call with pagination
    await new Promise(resolve => setTimeout(resolve, 600)); // Network delay
    const limit = 4; // Fetch 4 trips at a time so we can see the loading state easily
    const start = (pageNumber - 1) * limit;
    const end = start + limit;
    return {
      data: MOCK_TRIPS.slice(start, end),
      totalPages: Math.ceil(MOCK_TRIPS.length / limit)
    };
  };

  const loadTrips = async (pageNumber: number) => {
    if (pageNumber === 1) setLoadingInitial(true);
    else setLoadingMore(true);

    try {
      const res = await fetchTripsPage(pageNumber);
      if (pageNumber === 1) {
        setTrips(res.data);
      } else {
        setTrips(prev => {
          const newItems = res.data.filter(item => !prev.some(p => p.id === item.id));
          return [...prev, ...newItems];
        });
      }
      setHasMore(pageNumber < res.totalPages);
      setPage(pageNumber);
    } catch (e) {
      console.error(e);
    } finally {
      if (pageNumber === 1) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadTrips(1);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadTrips(page + 1);
    }
  };

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  // Advanced Filter Modal State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  
  const [paymentFilter, setPaymentFilter] = useState<"All" | "Cash" | "Dispatch">("All");
  const [claimFilter, setClaimFilter] = useState<"All" | "Claimed" | "Unclaimed">("All");

  const filteredTrips = useMemo(() => {
    // If we're using "custom", check if custom dates are actually set
    return trips.filter(trip => {
      // 1. Date filter
      if (!passesDateFilter(trip.date, filterPreset, customFrom, customTo)) return false;
      
      // 2. Payment Method filter
      if (paymentFilter !== "All" && trip.paymentMethod !== paymentFilter) return false;
      
      // 3. Claim Status filter (only applicable for Admin and Dispatch trips)
      if (isManager && paymentFilter !== "Cash" && claimFilter !== "All") {
        if (trip.paymentMethod === "Dispatch") {
          const isClaimed = !!trip.claimed;
          if (claimFilter === "Claimed" && !isClaimed) return false;
          if (claimFilter === "Unclaimed" && isClaimed) return false;
        }
      }
      return true;
    });
  }, [trips, filterPreset, customFrom, customTo, paymentFilter, claimFilter, isManager]);

  const tripGroups = getGroupedTrips(filteredTrips);

  useEffect(() => {
    if (isManager) {
      mockTruckService.getMyTrucks().then((res) => {
        if ("trucks" in res) {
          setTrucks([ALL_TRUCKS_MOCK, ...res.trucks]);
        }
      });
    }
  }, [isManager]);

  const handleDelete = (id: string) => {
    // We update local state to reflect deletion
    setTrips((current: typeof MOCK_TRIPS) => current.filter((t) => t.id !== id));
  };

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
                // Also trigger a fresh load if we want to "fetch without filters"
                loadTrips(1);
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
                  {["All", "Cash", "Dispatch"].map(method => (
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
              {isManager && paymentFilter !== "Cash" && (
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
                disabled={isApplyingFilters}
                onPress={async () => {
                  setIsApplyingFilters(true);
                  // Simulate network request delay
                  await new Promise(resolve => setTimeout(resolve, 800));
                  setIsApplyingFilters(false);
                  setShowAdvancedFilters(false);
                }}
                className="flex-1 bg-primary rounded-xl items-center justify-center py-3 shadow-sm border border-primary-600"
              >
                {isApplyingFilters ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-sm tracking-wide">Apply</Text>
                )}
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
          <TripCard trip={item} onDelete={handleDelete} isManager={isManager} />
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
          ) : !hasMore && trips.length > 0 ? (
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
