import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SectionList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore, useCacheStore } from "@/src/store";
import { DateFilterBar, DateFilterPreset } from "@/src/components/DateFilterBar";
import { tripService, truckService } from "@/src/api/services";
import { Trip, Truck, GetTripsQuery } from "@/src/types";
import {
  writeOpenFiltersDraft,
  consumeAppliedFilters,
  type AdminTripFiltersSnapshot,
} from "@/src/utils/adminTripFiltersStorage";

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

const TripCard = ({ trip, isManager, onRefresh, onUpdateTrip, onDelete, activePaymentFilter }: { trip: Trip, isManager: boolean, onRefresh: () => void, onUpdateTrip?: (updatedTrip: Trip) => void, onDelete?: (tripId: string) => void, activePaymentFilter: "CASH" | "CREDIT" }) => {
  const [expanded, setExpanded] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Determine the trip type: use companyId presence or fall back to the active filter
  const tripPaymentType = trip.companyId ? "CREDIT" : (trip.paymentMethod || activePaymentFilter);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await tripService.approveTrip(trip.id, tripPaymentType as "CASH" | "CREDIT");
      Alert.alert("Success", res.message || "Trip approved successfully!");
      if (res.updatedTrip && onUpdateTrip) {
        onUpdateTrip(res.updatedTrip);
      } else {
        onRefresh();
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Approval failed.");
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await tripService.deleteTrip(trip.id, tripPaymentType as "CASH" | "CREDIT");
      Alert.alert("Deleted", res.message || "Trip deleted successfully.");
      if (onDelete) onDelete(trip.id);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete trip.");
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = new Date(trip.date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });

  const volumeLabel = trip.volume === "MCUBE10" ? "10 M³" : trip.volume === "MCUBE16" ? "16 M³" : trip.volume;
  const routeTitle =
    [trip.loadingSite?.trim(), trip.destinationSite?.trim()].filter(Boolean).join(" — ") ||
    trip.destinationSite ||
    trip.loadingSite ||
    "Trip";
  const isPending = tripPaymentType === "CASH" && trip.approved !== "APPROVED";
  const showEditTrip = trip.approved !== "APPROVED";
  const showApproveOrDelete = trip.approved !== "APPROVED";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className={`bg-white rounded-2xl border mt-3 overflow-hidden shadow-sm ${isPending ? "border-amber-300" : "border-border"}`}
    >
      {/* ALWAYS VISIBLE: Header Row */}
      <View className="flex-row items-center justify-between p-4 bg-white">
        <View className="flex-row items-center flex-1 pr-3">
          <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${tripPaymentType === "CREDIT" ? "bg-primary-50" : "bg-success-50"}`}>
            <Ionicons name={tripPaymentType === "CREDIT" ? "business" : "cash"} size={20} color={tripPaymentType === "CREDIT" ? "#2563EB" : "#16A34A"} />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base" numberOfLines={2}>
              {routeTitle}
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              <Text className="text-text-secondary text-xs">{formattedDate}</Text>
              <View className="w-1 h-1 rounded-full bg-border" />
              <Text className="text-text-secondary text-xs">{volumeLabel}</Text>
              {trip.amount !== undefined && (
                <>
                  <View className="w-1 h-1 rounded-full bg-border" />
                  <Text className="text-success-700 text-xs font-bold">${trip.amount}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Status indicator */}
          <View className={`w-2 h-2 rounded-full ${
            trip.approved === "APPROVED" ? "bg-success" : "bg-amber-400"
          }`} />
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#94A3B8"
          />
        </View>
      </View>

      {/* EXPANDED CONTENT */}
      {expanded && (
        <View className="border-t border-border">
          {/* Route Details */}
          <View className="px-4 pt-3 pb-3">
            <View className="relative pl-2 pb-1">
              <View className="absolute left-4 top-2 bottom-6 w-px bg-border items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-primary-100 absolute -top-1" />
                <View className="w-2 h-2 rounded-full border border-primary bg-white absolute -bottom-1" />
              </View>
              <View className="ml-8 gap-4">
                <View>
                  <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">Loading Site</Text>
                  <Text className="text-text-primary text-sm font-medium mt-0.5">{trip.loadingSite}</Text>
                </View>
                <View>
                  <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">Unloading Site</Text>
                  <Text className="text-text-primary text-sm font-medium mt-0.5">{trip.destinationSite}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Detail Grid */}
          <View className="bg-surface/50 px-4 py-3 gap-3">
            <View className="flex-row gap-3">
              {/* Date */}
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Trip Date</Text>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={14} color="#64748B" />
                  <Text className="text-text-primary text-sm font-medium ml-1.5">{formattedDate}</Text>
                </View>
              </View>
              {/* Volume */}
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Volume</Text>
                <View className="flex-row items-center">
                  <Ionicons name="cube-outline" size={14} color="#64748B" />
                  <Text className="text-text-primary text-sm font-medium ml-1.5">{volumeLabel}</Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              {/* Amount */}
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                  {tripPaymentType === "CASH" ? "Cash Amount" : "Credit Amount"}
                </Text>
                <Text className="text-success-700 text-base font-bold">
                  ${trip.amount ?? 0}
                </Text>
              </View>
              {/* Road Expense */}
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Road Expense</Text>
                <Text className="text-text-primary text-base font-bold">
                  ${trip.roadExpence ?? 0}
                </Text>
              </View>
            </View>

            {/* Payment Method + Status Row */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Payment</Text>
                <View className={`self-start px-2.5 py-1 rounded-md ${tripPaymentType === "CASH" ? "bg-success-50" : "bg-primary-50"}`}>
                  <Text className={`text-xs font-bold ${tripPaymentType === "CASH" ? "text-success-600" : "text-primary-600"}`}>
                    {tripPaymentType}
                  </Text>
                </View>
              </View>
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Status</Text>
                {tripPaymentType === "CASH" ? (
                  <View className={`self-start px-2.5 py-1 rounded-md ${
                    trip.approved === "APPROVED" ? "bg-success-50" : "bg-amber-50"
                  }`}>
                    <Text className={`text-xs font-bold ${
                      trip.approved === "APPROVED" ? "text-success-700" : "text-amber-700"
                    }`}>
                      {trip.approved === "APPROVED" ? "APPROVED" : "PENDING"}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row gap-2">
                    <View className={`self-start px-2.5 py-1 rounded-md ${
                      trip.approved === "APPROVED" ? "bg-success-50" : "bg-amber-50"
                    }`}>
                      <Text className={`text-xs font-bold ${
                        trip.approved === "APPROVED" ? "text-success-700" : "text-amber-700"
                      }`}>
                        {trip.approved === "APPROVED" ? "APPROVED" : "PENDING"}
                      </Text>
                    </View>
                    <View className={`self-start px-2.5 py-1 rounded-md ${trip.claimed ? "bg-success-50" : "bg-amber-50"}`}>
                      <Text className={`text-xs font-bold ${trip.claimed ? "text-success-700" : "text-amber-700"}`}>
                        {trip.claimed ? "Claimed" : "Unclaimed"}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Company Info (Credit Trips) */}
            {tripPaymentType === "CREDIT" && (trip.contractedCompany || trip.company || trip.companyId) && (
              <View className="bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Company</Text>
                <View className="flex-row items-center">
                  <Ionicons name="business-outline" size={14} color="#2563EB" />
                  <Text className="text-primary font-semibold text-sm ml-1.5">
                    {trip.contractedCompany?.name || trip.company?.name || trip.companyId}
                  </Text>
                </View>
              </View>
            )}

            {/* Driver Info */}
            {isManager && trip.driver && (
              <View className="bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Driver</Text>
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={14} color="#64748B" />
                  <Text className="text-text-primary font-medium text-sm ml-1.5">
                    {trip.driver.name}
                  </Text>
                </View>
              </View>
            )}

            {/* Truck Info */}
            {isManager && trip.truck && (
              <View className="bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Truck</Text>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="truck" size={16} color="#64748B" />
                  <Text className="text-text-primary font-medium text-sm ml-1.5">
                    {trip.truck.plateNumber}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Bar (Admin Only) */}
          {isManager && (showEditTrip || showApproveOrDelete) && (
            <View className="px-4 py-3 bg-white border-t border-border flex-row items-center gap-3">
              {showEditTrip && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    // Determine trip type: if trip has companyId it's credit, otherwise use the paymentMethod field
                    const isCreditTrip = !!trip.companyId || trip.paymentMethod === "CREDIT";
                    const tripTypeParam = isCreditTrip ? "credit" : "cash";
                    const qs = `?id=${trip.id}&tripType=${tripTypeParam}&date=${encodeURIComponent(formattedDate)}&loadingSite=${encodeURIComponent(trip.loadingSite)}&unloadingSite=${encodeURIComponent(trip.destinationSite)}&paymentMethod=${isCreditTrip ? "CREDIT" : "CASH"}&cashAmount=${trip.amount || ""}&volume=${trip.volume}&roadExpense=${trip.roadExpence || 0}`;
                    router.push(`/add-trip${qs}` as any);
                  }}
                  className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-primary-50 border border-primary-100"
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={16} color="#2563EB" />
                  <Text className="text-primary font-bold text-sm">Edit Trip</Text>
                </TouchableOpacity>
              )}

              {/* Accept Button (for any pending trip) */}
              {showApproveOrDelete && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    Alert.alert(
                      "Approve Trip", 
                      `Approve this ${tripPaymentType.toLowerCase()} trip for $${trip.amount || 0}?`, 
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Approve", onPress: handleApprove }
                      ]
                    );
                  }}
                  disabled={approving || deleting}
                  className="flex-[1.5] flex-row items-center justify-center gap-2 py-3 rounded-xl bg-success-50 border border-success-200"
                  activeOpacity={0.7}
                >
                  {approving ? (
                    <ActivityIndicator size="small" color="#16A34A" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                      <Text className="text-success-700 font-bold text-sm">Accept</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Delete Button (for non-approved trips only) */}
              {showApproveOrDelete && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    Alert.alert(
                      "Delete Trip",
                      `Are you sure you want to delete this trip to ${trip.destinationSite}?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: handleDelete }
                      ]
                    );
                  }}
                  disabled={deleting || approving}
                  className="w-12 items-center justify-center py-3 rounded-xl bg-danger-50 border border-danger-200"
                  activeOpacity={0.7}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <Ionicons name="trash" size={18} color="#DC2626" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function TripsListScreen() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ truckId?: string; truckPlate?: string }>();
  const isManager = user?.role === "admin" || (user?.role as string) === "manager";

  // Initialize trucks from cached profile
  const cachedTrucks: Truck[] = (user?.profile?.trucks || []).map((t: any) => ({
    id: t.id,
    plateNumber: t.plateNumber,
    vinNumber: t.vinNumber,
    brand: t.brand,
    model: t.model,
    adminId: t.adminId || user?.id || "",
  }));

  const allTrucksOption: Truck = { id: "", plateNumber: "All Trucks", adminId: "" };
  const [showTruckMenu, setShowTruckMenu] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>(cachedTrucks);

  // Pre-select truck if navigated from driver-detail with truckId
  const initialTruck = params.truckId
    ? cachedTrucks.find(t => t.id === params.truckId) || { id: params.truckId, plateNumber: params.truckPlate || "Unknown", adminId: "" }
    : allTrucksOption;
  const [selectedTruck, setSelectedTruck] = useState<Truck>(initialTruck);
  const [refreshingTrucks, setRefreshingTrucks] = useState(false);

  const { trips: cachedTrips, setTrips: setCachedTrips } = useCacheStore();

  // Trip Pagination State
  const [trips, setTrips] = useState<Trip[]>(cachedTrips);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(cachedTrips.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const [paymentFilter, setPaymentFilter] = useState<"CASH" | "CREDIT">("CASH");
  const [claimFilter, setClaimFilter] = useState<"All" | "Claimed" | "Unclaimed">("All");

  // Advanced filters (applied state; edit on /admin-trip-filters)
  const [advLoadingSite, setAdvLoadingSite] = useState("");
  const [advDestinationSite, setAdvDestinationSite] = useState("");
  const [advAmount, setAdvAmount] = useState("");
  const [advRoadExpence, setAdvRoadExpence] = useState("");
  const [advVolume, setAdvVolume] = useState<"" | "MCUBE10" | "MCUBE16">("");
  const [advApproved, setAdvApproved] = useState<"" | "PENDING" | "APPROVED" | "DECLINED">("");
  const [advCompanyId, setAdvCompanyId] = useState("");

  type TripFiltersRef = {
    paymentFilter: "CASH" | "CREDIT";
    customFrom: Date | null;
    customTo: Date | null;
    claimFilter: "All" | "Claimed" | "Unclaimed";
    advLoadingSite: string;
    advDestinationSite: string;
    advAmount: string;
    advRoadExpence: string;
    advVolume: "" | "MCUBE10" | "MCUBE16";
    advApproved: "" | "PENDING" | "APPROVED" | "DECLINED";
    advCompanyId: string;
  };

  const tripFiltersRef = useRef<TripFiltersRef>({
    paymentFilter: "CASH",
    customFrom: null,
    customTo: null,
    claimFilter: "All",
    advLoadingSite: "",
    advDestinationSite: "",
    advAmount: "",
    advRoadExpence: "",
    advVolume: "",
    advApproved: "",
    advCompanyId: "",
  });

  useEffect(() => {
    tripFiltersRef.current = {
      paymentFilter,
      customFrom,
      customTo,
      claimFilter,
      advLoadingSite,
      advDestinationSite,
      advAmount,
      advRoadExpence,
      advVolume,
      advApproved,
      advCompanyId,
    };
  }, [
    paymentFilter,
    customFrom,
    customTo,
    claimFilter,
    advLoadingSite,
    advDestinationSite,
    advAmount,
    advRoadExpence,
    advVolume,
    advApproved,
    advCompanyId,
  ]);

  const buildQuery = (pageNumber: number): GetTripsQuery => {
    const tf = tripFiltersRef.current;
    const query: GetTripsQuery = {
      page: pageNumber,
      perpage: 10,
      paymentMethod: tf.paymentFilter,
    };

    if (isManager && selectedTruck.id) {
      query.truckId = selectedTruck.id;
    }

    if (tf.paymentFilter === "CREDIT") {
      if (tf.claimFilter === "Claimed") {
        query.claimed = true;
      } else if (tf.claimFilter === "Unclaimed") {
        query.claimed = false;
      }
      // All: omit `claimed` — no filter on claim status
    }

    if (tf.paymentFilter === "CREDIT" && tf.advCompanyId.trim()) {
      query.companyId = tf.advCompanyId.trim();
    }

    if (tf.customFrom) {
      query.startDate = tf.customFrom.toISOString();
    }
    if (tf.customTo) {
      query.endDate = tf.customTo.toISOString();
    }

    const ls = tf.advLoadingSite.trim();
    if (ls) query.loadingSite = ls;
    const ds = tf.advDestinationSite.trim();
    if (ds) query.destinationSite = ds;

    const amt = Number(tf.advAmount);
    if (tf.advAmount.trim() !== "" && !Number.isNaN(amt)) query.amount = amt;

    const road = Number(tf.advRoadExpence);
    if (tf.advRoadExpence.trim() !== "" && !Number.isNaN(road)) query.roadExpence = road;

    if (tf.advVolume === "MCUBE10" || tf.advVolume === "MCUBE16") {
      query.volume = tf.advVolume;
    }

    if (tf.paymentFilter === "CASH" && tf.advApproved) {
      query.approved = tf.advApproved;
    }

    return query;
  };

  const loadTrips = useCallback(async (pageNumber: number, append = false) => {
    if (pageNumber === 1) setLoadingInitial(true);
    else setLoadingMore(true);

    try {
      const query = buildQuery(pageNumber);
      const res = await tripService.getTrips(query);
      setTrips((prev) => (append ? [...prev, ...res.data] : res.data));
      setPage(res.meta.currentPage);
      setTotalPages(res.meta.totalPages);
      
      // Update global cache if we fetched the default list (Page 1, All Trucks, CASH)
      if (pageNumber === 1 && !append && !query.truckId && query.paymentMethod === "CASH" && query.startDate === undefined) {
        setCachedTrips(res.data);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load trips");
    } finally {
      if (pageNumber === 1) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  }, [selectedTruck, isManager, setCachedTrips, paymentFilter]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips(1);
    setRefreshing(false);
  }, [loadTrips]);

  // Reload when screen is focused; consume filter page "Apply" from AsyncStorage first
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const applied = await consumeAppliedFilters();
        if (cancelled) return;
        if (applied) {
          setFilterPreset(applied.filterPreset ?? "all");
          setCustomFrom(applied.customFromIso ? new Date(applied.customFromIso) : null);
          setCustomTo(applied.customToIso ? new Date(applied.customToIso) : null);
          setClaimFilter(applied.claimFilter);
          setAdvLoadingSite(applied.advLoadingSite ?? "");
          setAdvDestinationSite(applied.advDestinationSite ?? "");
          setAdvAmount(applied.advAmount ?? "");
          setAdvRoadExpence(applied.advRoadExpence ?? "");
          setAdvVolume((applied.advVolume as "" | "MCUBE10" | "MCUBE16") || "");
          setAdvApproved((applied.advApproved as TripFiltersRef["advApproved"]) || "");
          setAdvCompanyId(applied.advCompanyId ?? "");
          tripFiltersRef.current = {
            ...tripFiltersRef.current,
            customFrom: applied.customFromIso ? new Date(applied.customFromIso) : null,
            customTo: applied.customToIso ? new Date(applied.customToIso) : null,
            claimFilter: applied.claimFilter,
            advLoadingSite: applied.advLoadingSite ?? "",
            advDestinationSite: applied.advDestinationSite ?? "",
            advAmount: applied.advAmount ?? "",
            advRoadExpence: applied.advRoadExpence ?? "",
            advVolume: (applied.advVolume as TripFiltersRef["advVolume"]) || "",
            advApproved: (applied.advApproved as TripFiltersRef["advApproved"]) || "",
            advCompanyId: applied.advCompanyId ?? "",
          };
        }
        if (!cancelled) await loadTrips(1);
      })();
      return () => {
        cancelled = true;
      };
    }, [loadTrips, paymentFilter])
  );

  const handleLoadMore = () => {
    if (!loadingMore && !loadingInitial && page < totalPages) {
      loadTrips(page + 1, true);
    }
  };

  const handleDeleteTripInList = (tripId: string) => {
    setTrips(prev => prev.filter(t => t.id !== tripId));
  };

  const handleUpdateTripInList = (updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? { ...t, ...updatedTrip } : t));
  };

  const tripGroups = getGroupedTrips(trips);

  const openTripFiltersPage = useCallback(async () => {
    const draft: AdminTripFiltersSnapshot = {
      filterPreset,
      customFromIso: customFrom?.toISOString() ?? null,
      customToIso: customTo?.toISOString() ?? null,
      claimFilter,
      advLoadingSite,
      advDestinationSite,
      advAmount,
      advRoadExpence,
      advVolume,
      advApproved,
      advCompanyId,
    };
    await writeOpenFiltersDraft(draft);
    router.push(`/admin-trip-filters?paymentMethod=${paymentFilter}` as any);
  }, [
    filterPreset,
    customFrom,
    customTo,
    claimFilter,
    advLoadingSite,
    advDestinationSite,
    advAmount,
    advRoadExpence,
    advVolume,
    advApproved,
    advCompanyId,
    paymentFilter,
  ]);

  // Refresh trucks from API only when dropdown is opened
  const handleOpenTruckDropdown = async () => {
    setShowTruckMenu((v) => !v);
    if (!showTruckMenu && isManager) {
      setRefreshingTrucks(true);
      try {
        const res = await truckService.getMyTrucks();
        if ("trucks" in res && res.trucks.length > 0) {
          const mapped: Truck[] = res.trucks.map((t: any) => ({
            id: t.id,
            plateNumber: t.plateNumber,
            vinNumber: t.vinNumber,
            brand: t.brand,
            model: t.model,
            adminId: t.adminId || user?.id || "",
          }));
          setTrucks(mapped);
        }
      } catch (e) {
        // Silently fail — keep cached trucks
      } finally {
        setRefreshingTrucks(false);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-border shadow-sm bg-white" style={{ zIndex: 50, elevation: 10 }}>
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="truck" size={26} color="#2563EB" />
          <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide">Trips</Text>
        </View>
        {isManager && (
          <View className="relative">
            <TouchableOpacity
              onPress={handleOpenTruckDropdown}
              className="flex-row items-center gap-1.5 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2"
              activeOpacity={0.8}
            >
              <Ionicons name="car-sport" size={14} color="#2563EB" />
              <Text className="text-primary font-semibold text-sm">{selectedTruck.plateNumber}</Text>
              {refreshingTrucks ? (
                <ActivityIndicator size={12} color="#2563EB" />
              ) : (
                <Ionicons name={showTruckMenu ? "chevron-up" : "chevron-down"} size={14} color="#2563EB" />
              )}
            </TouchableOpacity>

            {showTruckMenu && (
              <View className="absolute right-0 top-10 bg-white rounded-2xl border border-border shadow-lg overflow-hidden min-w-[160px]" style={{ zIndex: 999, elevation: 20 }}>
                {[allTrucksOption, ...trucks].map((truck) => (
                  <TouchableOpacity
                    key={truck.id || "__all__"}
                    onPress={() => {
                      setTrips([]);
                      setSelectedTruck(truck);
                      setShowTruckMenu(false);
                    }}
                    className={`px-4 py-3 flex-row items-center gap-2 ${
                      selectedTruck.id === truck.id ? "bg-primary-50" : "bg-white"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="car-sport-outline"
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

      {/* Cash / Credit Toggle */}
      {isManager && (
        <View className="bg-white px-5 pt-3 pb-2 border-b border-border" style={{ zIndex: 2, elevation: 1 }}>
          <View className="flex-row bg-surface rounded-xl p-1 border border-border">
            <TouchableOpacity
              onPress={() => {
                setTrips([]);
                setPaymentFilter("CASH");
                setAdvCompanyId("");
              }}
              className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg ${
                paymentFilter === "CASH" ? "bg-white border border-border" : ""
              }`}
              style={paymentFilter === "CASH" ? { elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : {}}
              activeOpacity={0.8}
            >
              <Ionicons name="cash" size={16} color={paymentFilter === "CASH" ? "#16A34A" : "#94A3B8"} />
              <Text className={`font-bold text-sm ${
                paymentFilter === "CASH" ? "text-success-700" : "text-text-secondary"
              }`}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setTrips([]);
                setPaymentFilter("CREDIT");
                setAdvApproved("");
              }}
              className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg ${
                paymentFilter === "CREDIT" ? "bg-white border border-border" : ""
              }`}
              style={paymentFilter === "CREDIT" ? { elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : {}}
              activeOpacity={0.8}
            >
              <Ionicons name="business" size={16} color={paymentFilter === "CREDIT" ? "#2563EB" : "#94A3B8"} />
              <Text className={`font-bold text-sm ${
                paymentFilter === "CREDIT" ? "text-primary" : "text-text-secondary"
              }`}>Credit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter Section */}
      <View className="bg-white flex-row items-center border-b border-border shadow-sm" style={{ zIndex: 1, elevation: 0 }}>
        <View className="flex-1">
          <DateFilterBar
            activePreset={filterPreset}
            hideCustomPreset
            onPresetChange={(preset) => {
              setFilterPreset(preset);
              if (preset === "all") {
                setClaimFilter("All");
                setCustomFrom(null);
                setCustomTo(null);
              } else if (preset !== "custom") {
                const end = new Date();
                const start = new Date();
                if (preset === "today") start.setHours(0,0,0,0);
                if (preset === "week" || (preset as any) === "7d") start.setDate(end.getDate() - 7);
                if (preset === "month" || (preset as any) === "30d") start.setDate(end.getDate() - 30);
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
          onPress={() => void openTripFiltersPage()}
          className="w-10 h-10 bg-primary-50 rounded-lg items-center justify-center border border-primary-100 mr-4"
          activeOpacity={0.7}
        >
          <Ionicons name="options" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>


      <SectionList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        sections={tripGroups}
        keyExtractor={(item, index) => item.id + index}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1 mt-6">
            {title}
          </Text>
        )}
        renderItem={({ item }) => (
          <TripCard trip={item} isManager={isManager} onRefresh={() => loadTrips(1)} onUpdateTrip={handleUpdateTripInList} onDelete={handleDeleteTripInList} activePaymentFilter={paymentFilter} />
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

    </SafeAreaView>
  );
}
