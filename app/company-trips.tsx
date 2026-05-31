import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore, useActionStore } from "@/src/store";
import { truckService, companyService } from "@/src/api/services";
import { TripReceiptViewer } from "@/src/components/TripReceiptViewer";
import { Trip, Truck } from "@/src/types";
import { hasValidTripReceiptPic } from "@/src/utils/tripReceipt";

/** Backend requires `moneyWorth`; use this when the user leaves sum cap empty (no practical limit). */
const MONEY_WORTH_NO_CAP = 999_999_999_999;

function paramFirst(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function parseAssignedTrucksParam(raw: string | string[] | undefined): Truck[] {
  const s = paramFirst(raw);
  if (!s) return [];
  const tryParse = (json: string) => {
    const trimmed = json.trim();
    if (!trimmed.startsWith("[")) return [];
    const arr = JSON.parse(trimmed) as { id: string; plateNumber: string }[];
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => ({
      id: String(x.id),
      plateNumber: String(x.plateNumber ?? ""),
      adminId: "",
    }));
  };
  try {
    return tryParse(s);
  } catch {
    try {
      return tryParse(decodeURIComponent(s));
    } catch {
      return [];
    }
  }
}

/** Stable reference for dropdown + selection (avoid new object each render). */
const ALL_TRUCKS_DROPDOWN: Truck = { id: "", plateNumber: "All Trucks", adminId: "" };

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

const sortTripsDesc = (trips: Trip[]) =>
  [...trips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const mergeTripsByDateDesc = (prev: Trip[], incoming: Trip[]): Trip[] => {
  const map = new Map<string, Trip>();
  prev.forEach((t) => map.set(t.id, t));
  incoming.forEach((t) => map.set(t.id, t));
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

const getGroupedTrips = (trips: Trip[]) => {
  const grouped = trips.reduce((acc, trip) => {
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

const CompanyTripCard = ({
  trip,
  runningSum,
  selected,
  onToggleSelect,
  resolveTruckPlate,
}: {
  trip: Trip;
  runningSum: number;
  selected: boolean;
  onToggleSelect: () => void;
  resolveTruckPlate: (truckId: string) => string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const tripPaymentType = "CREDIT" as const;

  const formattedDate = new Date(trip.date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const volumeLabel =
    trip.volume === "MCUBE10" ? "10 M³" : trip.volume === "MCUBE16" ? "16 M³" : trip.volume;

  return (
    <View
      className={`bg-white rounded-2xl border mt-3 overflow-hidden shadow-sm ${
        selected ? "border-primary-200 border-2" : "border-border"
      }`}
    >
      <View className="flex-row items-stretch bg-white">
        <TouchableOpacity
          onPress={onToggleSelect}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="pl-3 pr-2 justify-center"
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
        >
          <View
            className={`w-7 h-7 rounded-lg border-2 items-center justify-center ${
              selected ? "bg-primary border-primary" : "border-border bg-white"
            }`}
          >
            {selected ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setExpanded(!expanded)}
          className="flex-1 flex-row items-center justify-between py-4 pr-4"
        >
          <View className="flex-row items-center flex-1 pr-2">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-primary-50">
              <Ionicons name="business" size={20} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
                {trip.destinationSite}
              </Text>
              <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
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
            <View
              className={`w-2 h-2 rounded-full ${trip.approved === "APPROVED" ? "bg-success" : "bg-amber-400"}`}
            />
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
          </View>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View className="border-t border-border">
          <View className="px-4 pt-3 pb-3">
            <View className="relative pl-2 pb-1">
              <View className="absolute left-4 top-2 bottom-6 w-px bg-border items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-primary-100 absolute -top-1" />
                <View className="w-2 h-2 rounded-full border border-primary bg-white absolute -bottom-1" />
              </View>
              <View className="ml-8 gap-4">
                <View>
                  <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                    Loading Site
                  </Text>
                  <Text className="text-text-primary text-sm font-medium mt-0.5">{trip.loadingSite}</Text>
                </View>
                <View>
                  <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                    Unloading Site
                  </Text>
                  <Text className="text-text-primary text-sm font-medium mt-0.5">{trip.destinationSite}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="bg-surface/50 px-4 py-3 gap-3">
            <View className="bg-primary-50 rounded-xl p-3 border border-primary-100">
              <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                Running sum (selected trips on this screen, this row → older)
              </Text>
              <Text className="text-primary font-bold text-2xl">${runningSum.toLocaleString()}</Text>
              {!selected && (
                <Text className="text-text-secondary text-xs mt-2">
                  This trip is excluded from the sum until you select it.
                </Text>
              )}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                  Trip Date
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={14} color="#64748B" />
                  <Text className="text-text-primary text-sm font-medium ml-1.5">{formattedDate}</Text>
                </View>
              </View>
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                  Volume
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="cube-outline" size={14} color="#64748B" />
                  <Text className="text-text-primary text-sm font-medium ml-1.5">{volumeLabel}</Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                  Credit Amount
                </Text>
                <Text className="text-success-700 text-base font-bold">${trip.amount ?? 0}</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                  Road Expense
                </Text>
                <Text className="text-text-primary text-base font-bold">${trip.roadExpence ?? 0}</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                  Payment
                </Text>
                <View className="self-start px-2.5 py-1 rounded-md bg-primary-50">
                  <Text className="text-xs font-bold text-primary-600">{tripPaymentType}</Text>
                </View>
              </View>
              <View className="flex-1 bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                  Status
                </Text>
                <View className="flex-row gap-2 flex-wrap">
                  <View
                    className={`self-start px-2.5 py-1 rounded-md ${
                      trip.approved === "APPROVED" ? "bg-success-50" : "bg-amber-50"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        trip.approved === "APPROVED" ? "text-success-700" : "text-amber-700"
                      }`}
                    >
                      {trip.approved === "APPROVED" ? "APPROVED" : "PENDING"}
                    </Text>
                  </View>
                  <View
                    className={`self-start px-2.5 py-1 rounded-md ${trip.claimed ? "bg-success-50" : "bg-amber-50"}`}
                  >
                    <Text className={`text-xs font-bold ${trip.claimed ? "text-success-700" : "text-amber-700"}`}>
                      {trip.claimed ? "Claimed" : "Unclaimed"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {trip.driver?.name?.trim() ? (
              <View className="bg-white rounded-xl p-3 border border-border">
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                  Driver
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={14} color="#64748B" />
                  <Text className="text-text-primary font-medium text-sm ml-1.5">{trip.driver?.name}</Text>
                </View>
              </View>
            ) : null}

            {(() => {
              const plate =
                trip.truck?.plateNumber?.trim() ||
                (trip.truckId ? resolveTruckPlate(trip.truckId).trim() : "");
              return plate.length > 0 ? (
                <View className="bg-white rounded-xl p-3 border border-border">
                  <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                    Truck
                  </Text>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="truck" size={16} color="#64748B" />
                    <Text className="text-text-primary font-medium text-sm ml-1.5">{plate}</Text>
                  </View>
                </View>
              ) : null;
            })()}

            {hasValidTripReceiptPic(trip.receiptPic) && (
              <View className="bg-white rounded-xl p-3 border border-border flex-row items-center justify-between">
                <View>
                  <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                    Receipt
                  </Text>
                  <Text className="text-text-primary text-sm font-medium">View attached receipt</Text>
                </View>
                <TripReceiptViewer receiptPic={trip.receiptPic} />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default function CompanyTripsScreen() {
  const params = useLocalSearchParams<{
    companyId?: string;
    name?: string;
    currentBalance?: string;
    presetTruckId?: string;
    presetTruckPlate?: string;
    assignedTrucks?: string;
  }>();
  const companyId = paramFirst(params.companyId);
  const name = paramFirst(params.name);
  const { user } = useAuthStore();
  const { isActionPending, startAction, stopAction } = useActionStore();
  const isManager = user?.role === "admin" || (user?.role as string) === "manager";

  const companyAssignedTrucks = useMemo(
    () => parseAssignedTrucksParam(params.assignedTrucks),
    [params.assignedTrucks]
  );

  const cachedTrucks = useMemo(
    () =>
      (user?.profile?.trucks || []).map((t: any) => ({
        id: t.id,
        plateNumber: t.plateNumber,
        vinNumber: t.vinNumber,
        brand: t.brand,
        model: t.model,
        adminId: t.adminId || user?.id || "",
      })),
    [user?.profile?.trucks, user?.id]
  );

  const presetTruckId = paramFirst(params.presetTruckId);
  const presetTruckPlate = paramFirst(params.presetTruckPlate);

  const [showTruckMenu, setShowTruckMenu] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>(() =>
    companyAssignedTrucks.length > 0
      ? companyAssignedTrucks.map((t) => ({ ...t, adminId: "" }))
      : []
  );
  const [selectedTruck, setSelectedTruck] = useState<Truck>(() => {
    const tid = paramFirst(params.presetTruckId);
    const tpl = paramFirst(params.presetTruckPlate);
    if (tid && tpl) return { id: tid, plateNumber: tpl, adminId: "" };
    if (tid) return { id: tid, plateNumber: "Truck", adminId: "" };
    return ALL_TRUCKS_DROPDOWN;
  });
  const [refreshingTrucks, setRefreshingTrucks] = useState(false);

  useEffect(() => {
    const adminId = useAuthStore.getState().user?.id || "";
    const assigned = companyAssignedTrucks;

    setSelectedTruck((prev) => {
      let next: Truck;
      if (!presetTruckId) {
        next = ALL_TRUCKS_DROPDOWN;
      } else {
        const found = assigned.find((t) => t.id === presetTruckId);
        if (found) {
          next = { id: found.id, plateNumber: found.plateNumber, adminId };
        } else {
          next = {
            id: presetTruckId,
            plateNumber: presetTruckPlate && presetTruckPlate.length > 0 ? presetTruckPlate : "Truck",
            adminId,
          };
        }
      }
      if (
        prev.id === next.id &&
        prev.plateNumber === next.plateNumber &&
        (prev.adminId || "") === (next.adminId || "")
      ) {
        return prev;
      }
      return next;
    });
  }, [companyId, presetTruckId, presetTruckPlate, companyAssignedTrucks]);

  useEffect(() => {
    const adminId = user?.id || "";
    let list: Truck[] =
      companyAssignedTrucks.length > 0
        ? companyAssignedTrucks.map((t) => ({ ...t, adminId }))
        : cachedTrucks.length > 0
          ? cachedTrucks
          : [];

    if (presetTruckId && !list.some((t) => t.id === presetTruckId)) {
      list = [
        ...list,
        {
          id: presetTruckId,
          plateNumber: presetTruckPlate && presetTruckPlate.length > 0 ? presetTruckPlate : "Truck",
          adminId,
        },
      ];
    }
    setTrucks(list);
  }, [companyAssignedTrucks, cachedTrucks, presetTruckId, presetTruckPlate, user?.id]);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [moneyFilterInput, setMoneyFilterInput] = useState("");
  const [debouncedMoney, setDebouncedMoney] = useState("");

  const sumCapSeedKey = `${companyId ?? ""}|${paramFirst(params.currentBalance) ?? ""}`;
  const lastSumCapSeed = useRef<string | null>(null);
  useEffect(() => {
    const bal = paramFirst(params.currentBalance);
    if (bal === undefined || bal === "") return;
    if (lastSumCapSeed.current === sumCapSeedKey) return;
    const n = Math.round(Number(bal));
    if (Number.isNaN(n)) return;
    lastSumCapSeed.current = sumCapSeedKey;
    setMoneyFilterInput(String(n));
    setDebouncedMoney(String(n));
  }, [sumCapSeedKey, params.currentBalance]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMoney(moneyFilterInput), 400);
    return () => clearTimeout(t);
  }, [moneyFilterInput]);

  const sumCapParsed = useMemo(() => {
    const raw = debouncedMoney.trim();
    if (raw === "") return undefined;
    const n = Number(raw);
    return !isNaN(n) && n > 0 ? n : undefined;
  }, [debouncedMoney]);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [loadedTrips, setLoadedTrips] = useState<Trip[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [allMatchingTripIds, setAllMatchingTripIds] = useState<string[]>([]);
  const [amountByTripId, setAmountByTripId] = useState<Record<string, number>>({});
  const [truckIdByTripId, setTruckIdByTripId] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const resolveTruckPlate = useCallback(
    (truckId: string) => {
      if (!truckId) return "";
      const fromDropdown = trucks.find((x) => x.id === truckId)?.plateNumber;
      if (fromDropdown) return fromDropdown;
      const fromAssigned = companyAssignedTrucks.find((x) => x.id === truckId)?.plateNumber;
      if (fromAssigned) return fromAssigned;
      const fromProfile = cachedTrucks.find((x) => x.id === truckId)?.plateNumber;
      if (fromProfile) return fromProfile;
      return "Unknown plate";
    },
    [trucks, companyAssignedTrucks, cachedTrucks]
  );

  const fetchFirstPage = useCallback(async () => {
    if (!companyId) {
      setLoadError("Missing company");
      setLoadingInitial(false);
      setLoadedTrips([]);
      setAllMatchingTripIds([]);
      setAmountByTripId({});
      setTruckIdByTripId({});
      setSelectedIds(new Set());
      return;
    }

    setLoadingInitial(true);
    setLoadError(null);
    try {
      const res = await companyService.getCompanyTripsByMoneyWorth({
        companyId,
        moneyWorth: sumCapParsed ?? MONEY_WORTH_NO_CAP,
        truckIds: selectedTruck.id ? [selectedTruck.id] : undefined,
        page: 1,
        perPage: 10,
      });
      setLoadedTrips(sortTripsDesc(res.trips));
      setPage(res.meta.page);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.totalItems);
      setAllMatchingTripIds(res.allMatchingTripIds);
      setAmountByTripId(res.amountByTripId);
      setTruckIdByTripId(res.truckIdByTripId);
      setSelectedIds(new Set(res.allMatchingTripIds));
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load trips");
      setLoadedTrips([]);
      setAllMatchingTripIds([]);
      setAmountByTripId({});
      setTruckIdByTripId({});
      setSelectedIds(new Set());
    } finally {
      setLoadingInitial(false);
    }
  }, [companyId, selectedTruck.id, sumCapParsed]);

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (!companyId || loadingMore || loadingInitial || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await companyService.getCompanyTripsByMoneyWorth({
        companyId,
        moneyWorth: sumCapParsed ?? MONEY_WORTH_NO_CAP,
        truckIds: selectedTruck.id ? [selectedTruck.id] : undefined,
        page: nextPage,
        perPage: 10,
      });
      setLoadedTrips((prev) => mergeTripsByDateDesc(prev, res.trips));
      setPage(res.meta.page);
      setAmountByTripId((prev) => {
        const next = { ...prev };
        res.trips.forEach((t) => {
          if (t.id && next[t.id] === undefined) next[t.id] = Number(t.amount ?? 0);
        });
        return next;
      });
      setTruckIdByTripId((prev) => {
        const next = { ...prev };
        res.trips.forEach((t) => {
          if (t.id && next[t.id] === undefined) next[t.id] = String(t.truckId ?? "");
        });
        return next;
      });
    } catch {
      // ignore page errors; user can retry via refresh
    } finally {
      setLoadingMore(false);
    }
  }, [companyId, loadingMore, loadingInitial, page, totalPages, selectedTruck.id, sumCapParsed]);

  const toggleTripSelection = useCallback((tripId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) next.delete(tripId);
      else next.add(tripId);
      return next;
    });
  }, []);

  const runningSumByTripId = useMemo(() => {
    const map = new Map<string, number>();
    let suffix = 0;
    for (let i = loadedTrips.length - 1; i >= 0; i--) {
      const trip = loadedTrips[i];
      if (selectedIds.has(trip.id)) {
        suffix += Number(trip.amount || 0);
      }
      map.set(trip.id, suffix);
    }
    return map;
  }, [loadedTrips, selectedIds]);

  const groupedSections = useMemo(() => getGroupedTrips(loadedTrips), [loadedTrips]);

  const matchingTotalSum = useMemo(
    () => allMatchingTripIds.reduce((s, id) => s + (amountByTripId[id] || 0), 0),
    [allMatchingTripIds, amountByTripId]
  );

  /** Sum cap vs total of matching trips — amber when they differ (e.g. cap not fully used). */
  const sumCapMismatchWithMatchingTotal = useMemo(() => {
    if (sumCapParsed === undefined || sumCapParsed <= 0) return false;
    return Math.round(matchingTotalSum) !== Math.round(sumCapParsed);
  }, [sumCapParsed, matchingTotalSum]);

  const selectedSumTotal = useMemo(() => {
    let s = 0;
    selectedIds.forEach((id) => {
      if (amountByTripId[id] !== undefined) s += amountByTripId[id];
    });
    return s;
  }, [selectedIds, amountByTripId]);

  /** Selected trip $ total vs sum cap — highlight when user capped budget but selection doesn't match. */
  const selectedTotalMismatchSumCap = useMemo(() => {
    if (sumCapParsed === undefined || sumCapParsed <= 0) return false;
    return Math.round(selectedSumTotal) !== Math.round(sumCapParsed);
  }, [sumCapParsed, selectedSumTotal]);

  const selectedCountInScope = useMemo(() => {
    let n = 0;
    selectedIds.forEach((id) => {
      if (amountByTripId[id] !== undefined) n += 1;
    });
    return n;
  }, [selectedIds, amountByTripId]);

  const handleClaimSelected = useCallback(() => {
    if (!companyId) return;
    const idsToClaim = Array.from(selectedIds).filter((id) => amountByTripId[id] !== undefined);
    if (idsToClaim.length === 0) {
      Alert.alert("No trips selected", "Select at least one trip to claim.");
      return;
    }

    const tripsPayload = idsToClaim.map((tid) => ({
      id: tid,
      amount: amountByTripId[tid] ?? 0,
      truckId: truckIdByTripId[tid] || loadedTrips.find((t) => t.id === tid)?.truckId || "",
    }));

    if (tripsPayload.some((t) => !t.truckId)) {
      Alert.alert(
        "Cannot claim",
        "Some trips are missing a truck id. Wait for the list to finish loading, or refresh and try again."
      );
      return;
    }

    const sum = tripsPayload.reduce((s, t) => s + t.amount, 0);
    Alert.alert(
      "Claim trips",
      `Claim ${tripsPayload.length} trip(s) totaling $${sum.toLocaleString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Claim",
          onPress: () => {
            void (async () => {
              startAction("claim_company_trips");
              try {
                await companyService.claimCompanyTrips(companyId, tripsPayload);
                await fetchFirstPage();
                Alert.alert("Success", `${tripsPayload.length} trip(s) claimed.`);
              } catch (err: any) {
                Alert.alert("Error", err?.message || "Claim failed");
              } finally {
                stopAction("claim_company_trips");
              }
            })();
          },
        },
      ]
    );
  }, [companyId, selectedIds, amountByTripId, truckIdByTripId, loadedTrips, fetchFirstPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFirstPage();
    setRefreshing(false);
  }, [fetchFirstPage]);

  const handleOpenTruckDropdown = async () => {
    setShowTruckMenu((v) => !v);
    if (!showTruckMenu && isManager && companyAssignedTrucks.length === 0) {
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
      } catch {
        // keep cached trucks
      } finally {
        setRefreshingTrucks(false);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      <View
        className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-border shadow-sm bg-white"
        style={{ zIndex: 50, elevation: 10 }}
      >
        <View className="flex-row items-center flex-1 pr-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-2"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View className="flex-1 min-w-0">
            <Text className="text-text-primary font-bold text-lg tracking-tight" numberOfLines={1}>
              Claim trips
            </Text>
            <Text className="text-text-secondary text-xs">
              {name ? `${name} · ` : ""}
              Unclaimed credit trips
            </Text>
          </View>
        </View>

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
            <View
              className="absolute right-0 top-10 bg-white rounded-2xl border border-border shadow-lg overflow-hidden min-w-[160px]"
              style={{ zIndex: 999, elevation: 20 }}
            >
              <ScrollView nestedScrollEnabled style={{ maxHeight: 280 }}>
                {[ALL_TRUCKS_DROPDOWN, ...trucks].map((truck) => (
                  <TouchableOpacity
                    key={truck.id || "__all__"}
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
                    {selectedTruck.id === truck.id && <Ionicons name="checkmark" size={14} color="#2563EB" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setShowFilterPanel(!showFilterPanel)}
        activeOpacity={0.85}
        className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-border"
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="options-outline" size={20} color="#2563EB" />
          <Text className="text-text-primary font-bold text-sm">Filters</Text>
          {(moneyFilterInput.trim() !== "") && (
            <View className="bg-primary px-2 py-0.5 rounded-full">
              <Text className="text-white text-[10px] font-bold">Active</Text>
            </View>
          )}
        </View>
        <Ionicons name={showFilterPanel ? "chevron-up" : "chevron-down"} size={22} color="#64748B" />
      </TouchableOpacity>

      {showFilterPanel && (
        <View className="bg-white px-4 pb-4 border-b border-border gap-4">
          <View>
            <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
              Sum cap ($)
            </Text>
            <Text className="text-text-secondary text-xs mb-2">
              Oldest→newest up to this cap. Leave empty for no limit. Truck filter uses the header dropdown.
            </Text>
            <TextInput
              value={moneyFilterInput}
              onChangeText={setMoneyFilterInput}
              keyboardType="decimal-pad"
              placeholder="No limit"
              placeholderTextColor="#94A3B8"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
            />
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between bg-surface rounded-xl px-3 py-2 border border-border">
              <Text className="text-text-secondary text-xs font-medium">Matching total (all pages)</Text>
              <Text
                className={`font-bold ${
                  sumCapMismatchWithMatchingTotal ? "text-amber-600" : "text-text-primary"
                }`}
              >
                ${matchingTotalSum.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row items-center justify-between bg-surface rounded-xl px-3 py-2 border border-border">
              <Text className="text-text-secondary text-xs font-medium">Matching trips</Text>
              <Text className="text-text-primary font-bold">{totalItems}</Text>
            </View>
            <View className="flex-row items-center justify-between bg-success-50 rounded-xl px-3 py-2 border border-success-100">
              <Text className="text-success-800 text-xs font-medium">Selected total</Text>
              <Text
                className={`font-bold ${
                  selectedTotalMismatchSumCap ? "text-red-600" : "text-success-800"
                }`}
              >
                ${selectedSumTotal.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className="bg-primary-50 px-4 py-2.5 border-b border-primary-100 flex-row items-center justify-between">
        <Text className="text-primary-900 text-sm font-medium">
          {selectedCountInScope} of {allMatchingTripIds.length} matching selected
        </Text>
        <Text
          className={`font-bold ${
            selectedTotalMismatchSumCap ? "text-red-600" : "text-text-primary"
          }`}
        >
          ${selectedSumTotal.toLocaleString()}
        </Text>
      </View>

      {loadError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-red-600 text-center mb-4">{loadError}</Text>
          <TouchableOpacity onPress={fetchFirstPage} className="bg-primary px-6 py-3 rounded-xl">
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : loadingInitial ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-text-secondary text-sm mt-3">Loading trips…</Text>
        </View>
      ) : (
        <SectionList
          sections={groupedSections}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1 mt-4">
              {title}
            </Text>
          )}
          renderItem={({ item }) => (
            <CompanyTripCard
              trip={item}
              runningSum={runningSumByTripId.get(item.id) ?? 0}
              selected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleTripSelection(item.id)}
              resolveTruckPlate={resolveTruckPlate}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 flex-row items-center justify-center gap-2">
                <ActivityIndicator size="small" color="#2563EB" />
                <Text className="text-text-secondary text-sm">Loading more…</Text>
              </View>
            ) : page < totalPages && loadedTrips.length > 0 ? (
              <View className="py-4 items-center">
                <Text className="text-text-secondary/60 text-xs">
                  Page {page} of {totalPages} · scroll for more
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-16 items-center px-6">
              <Ionicons name="map-outline" size={48} color="#CBD5E1" />
              <Text className="text-text-secondary text-sm mt-4 text-center">
                No trips match these filters.
              </Text>
            </View>
          }
        />
      )}

      {!loadingInitial && !loadError && (
        <TouchableOpacity
          onPress={handleClaimSelected}
          disabled={isActionPending("claim_company_trips")}
          activeOpacity={0.88}
          className={`absolute bottom-6 right-5 flex-row items-center gap-2 px-5 py-3.5 rounded-full shadow-lg border ${isActionPending("claim_company_trips") ? "bg-success-400 border-success-500" : "bg-success-600 border-success-700"}`}
          style={{ elevation: 10 }}
        >
          {isActionPending("claim_company_trips") ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
          )}
          <Text className="text-white font-bold text-base">Claim</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
