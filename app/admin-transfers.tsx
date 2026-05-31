import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SectionList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore, useCacheStore, useActionStore } from "@/src/store";
import { transferService, driverService } from "@/src/api/services";
import { Transfer } from "@/src/types/transfer.types";
import { DateFilterBar, DateFilterPreset, passesDateFilter } from "@/src/components/DateFilterBar";

const getRelativeDateLabel = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
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

const TransferCard = ({ tx, isManager, onApprove, onDelete, driverName }: { tx: Transfer, isManager: boolean, onApprove: (id: string)=>void, onDelete: (id: string)=>void, driverName?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const txId = tx._id || (tx as any).id;
  const isApproving = useActionStore((state) => !!state.pendingActions[`approve_transfer_${txId}`]);
  const isDeleting = useActionStore((state) => !!state.pendingActions[`delete_transfer_${txId}`]);
  
  const isIncrement = tx.sender === "ADMIN" || tx.sender === "manager" as any;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className="bg-white p-4 rounded-2xl mb-3 border border-border shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          <View 
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 border ${
              isIncrement ? "bg-success-50 border-success-100" : "bg-danger-50 border-danger-100"
            }`}
          >
            <Ionicons 
              name={isIncrement ? "arrow-up" : "arrow-down"} 
              size={18} 
              color={isIncrement ? "#16A34A" : "#DC2626"} 
            />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
              Transfer
            </Text>
            <Text className="text-text-secondary text-xs mt-0.5" numberOfLines={1}>
              Auth: {tx.sender}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text 
            className={`font-bold text-lg ${
              isIncrement ? "text-success-600" : "text-danger-600"
            }`}
          >
            {isIncrement ? "+" : "-"} ${tx.amount.toFixed(2)}
          </Text>
          
          <View className="flex-row items-center mt-1">
            <View className={`px-2 py-0.5 rounded mr-2 ${tx.status === "APPROVED" || (tx as any).approved === "APPROVED" ? "bg-success-100" : "bg-amber-100"}`}>
               <Text className={`text-[10px] font-bold uppercase tracking-wider ${tx.status === "APPROVED" || (tx as any).approved === "APPROVED" ? "text-success-700" : "text-amber-700"}`}>
                  {tx.status || (tx as any).approved || "PENDING"}
               </Text>
            </View>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#94A3B8"
            />
          </View>
        </View>
      </View>

      {/* EXPANDED CONTENT: Full Remark */}
      {expanded && (
        <View className="mt-3 pt-3 border-t border-border/50">
          <View className="bg-surface rounded-xl p-3 border border-border/50 mb-2 gap-2">
            <View className="flex-row items-center justify-between">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Driver</Text>
               <Text className="text-text-primary text-sm font-medium">{driverName || tx.driverId || "N/A"}</Text>
            </View>
            <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Sender</Text>
               <Text className="text-text-primary text-sm font-medium">{tx.sender}</Text>
            </View>
            <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Status</Text>
               <Text className="text-text-primary text-sm font-medium">{tx.status || (tx as any).approved}</Text>
            </View>
            <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Bank/Acct</Text>
               <Text className="text-text-primary text-sm font-medium">{tx.bank || "N/A"}</Text>
            </View>
            <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Date</Text>
               <Text className="text-text-primary text-sm font-medium">{tx.date ? tx.date.split("T")[0] : "N/A"}</Text>
            </View>
            <View className="flex-col pt-2 border-t border-border/30 gap-1">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Remark</Text>
               <Text className="text-text-primary text-[13px] leading-5">{tx.remark || "N/A"}</Text>
            </View>
          </View>
          
          {isManager && (tx.status === "PENDING" || (tx as any).approved === "PENDING") && (
            <View className="flex-row gap-3 pt-2">
              <TouchableOpacity
                className="flex-1 bg-success-500 py-2.5 rounded-xl items-center"
                activeOpacity={0.8}
                disabled={isApproving || isDeleting}
                onPress={(e) => { e.stopPropagation(); onApprove(txId); }}
              >
                {isApproving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-bold text-sm">Approve</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[0.7] bg-white border border-danger-500 py-2.5 rounded-xl items-center"
                activeOpacity={0.8}
                disabled={isApproving || isDeleting}
                onPress={(e) => { e.stopPropagation(); onDelete(txId); }}
              >
                {isDeleting ? <ActivityIndicator size="small" color="#DC2626" /> : <Text className="text-danger-600 font-bold text-sm">Delete</Text>}
              </TouchableOpacity>
            </View>
          )}

          {isManager && (tx.status === "APPROVED" || (tx as any).approved === "APPROVED") && (
            <View className="flex-row justify-end pt-2">
               <TouchableOpacity
                className="px-4 py-2 bg-danger-50 border border-danger-200 rounded-lg items-center"
                activeOpacity={0.8}
                disabled={isDeleting}
                onPress={(e) => { e.stopPropagation(); onDelete(txId); }}
              >
                {isDeleting ? <ActivityIndicator size="small" color="#DC2626" /> : <Text className="text-danger-600 font-semibold text-xs">Delete Record</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function TransfersScreen() {
  const { startAction, stopAction } = useActionStore();
  const { user } = useAuthStore();
  const { transfers: cachedTransfers, setTransfers: setCachedTransfers } = useCacheStore();
  const [allTransfers, setAllTransfers] = useState<Transfer[]>([]);
  const [displayedTransfers, setDisplayedTransfers] = useState<Transfer[]>(cachedTransfers);
  const [loadingInitial, setLoadingInitial] = useState(cachedTransfers.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { memoryCache } = require("@/src/hooks/useCachedFetch");
  const getInitialDriverMap = () => {
    const map: Record<string, string> = {};
    const cached = memoryCache["DRIVERS"]?.drivers || [];
    cached.forEach((d: any) => { map[d.id || d._id] = d.name; });
    return map;
  };

  const [driverMap, setDriverMap] = useState<Record<string, string>>(getInitialDriverMap());

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  // Driver Filter State
  const params = useLocalSearchParams<{ driverId?: string; driverName?: string }>();
  const [selectedDriverId, setSelectedDriverId] = useState<string>(params.driverId || "");
  const [showDriverMenu, setShowDriverMenu] = useState(false);

  // If we came with a pre-selected driver, make sure they are in the driverMap so the dropdown displays their name
  useEffect(() => {
    if (params.driverId && params.driverName) {
      setDriverMap(prev => ({ ...prev, [params.driverId as string]: params.driverName as string }));
    }
  }, [params.driverId, params.driverName]);

  const isManager = user?.role === "admin" || (user?.role as string) === "manager";

  const loadInitialData = async () => {
    setLoadingInitial(true);
    setPage(1);
    try {
      const res = await transferService.getTransfers({
         page: 1,
         perpage: 10,
         driverId: selectedDriverId || undefined,
         dateFrom: filterPreset !== "all" && customFrom ? customFrom.toISOString().split("T")[0] : undefined,
         dateTo: filterPreset !== "all" && customTo ? customTo.toISOString().split("T")[0] : undefined,
      });
      setDisplayedTransfers(res.transfers);
      setHasMore(res.meta?.currentPage < res.meta?.totalPages);
      
      // Update global cache if we fetched the default list (Page 1, No Driver, No Date Filters)
      if (!selectedDriverId && filterPreset === "all") {
        setCachedTransfers(res.transfers);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load transfers");
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
      const res = await transferService.getTransfers({
         page: nextPage,
         perpage: 10,
         driverId: selectedDriverId || undefined,
         dateFrom: filterPreset !== "all" && customFrom ? customFrom.toISOString().split("T")[0] : undefined,
         dateTo: filterPreset !== "all" && customTo ? customTo.toISOString().split("T")[0] : undefined,
      });
      
      const newItems = res.transfers.filter(item => !displayedTransfers.some(p => (p._id || (p as any).id) === (item._id || (item as any).id)));
      setDisplayedTransfers(prev => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(res.meta?.currentPage < res.meta?.totalPages);
    } catch (error) {
       // silently fail load more
    }
    setLoadingMore(false);
  };

  const handleApprove = async (id: string) => {
    const actionKey = `approve_transfer_${id}`;
    if (useActionStore.getState().isActionPending(actionKey)) return;

    startAction(actionKey);
    try {
      const res = await transferService.approveTransfer(id);
      if (res.updatedTransfer) {
        setDisplayedTransfers(prev => prev.map(t => (t._id || (t as any).id) === id ? { ...t, ...res.updatedTransfer, status: "APPROVED" } : t));
      } else {
        setDisplayedTransfers(prev => prev.map(t => (t._id || (t as any).id) === id ? { ...t, status: "APPROVED" } : t));
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to approve transfer.");
    } finally {
      stopAction(actionKey);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this transfer? This action is irreversible.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
         const actionKey = `delete_transfer_${id}`;
         if (useActionStore.getState().isActionPending(actionKey)) return;

         startAction(actionKey);
         try {
           await transferService.deleteTransfer(id);
           setDisplayedTransfers(prev => prev.filter(t => (t._id || (t as any).id) !== id));
         } catch (error: any) {
           Alert.alert("Error", error.message || "Failed to delete transfer.");
         } finally {
           stopAction(actionKey);
         }
      }}
    ]);
  };

  useEffect(() => {
    loadInitialData();
  }, [selectedDriverId]);

  useEffect(() => {
    if (isManager) {
      driverService.getMyDrivers().then(res => {
        const map: Record<string, string> = {};
        res.drivers.forEach((d: any) => { map[d.id || d._id] = d.name; });
        setDriverMap(map);
      }).catch(() => console.log("Silent fail driver map load"));
    }
  }, []);

  // With real API, date filtering is done server-side on loadInitialData
  // so we don't need the local filteredDataFull effect loop

  const groupedTransfers = displayedTransfers.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, typeof displayedTransfers>);

  const transferGroups = Object.entries(groupedTransfers).map(([date, txs]) => ({
    dateStr: date,
    title: getRelativeDateLabel(date),
    data: txs,
  }));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 bg-white border-b border-border shadow-sm" style={{ zIndex: 50, elevation: 10 }}>
        <View className="flex-row items-center">
          <Ionicons name="swap-horizontal" size={26} color="#2563EB" />
          <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide">
            Transfers
          </Text>
        </View>

        {isManager && (
          <View className="relative">
            <TouchableOpacity
              onPress={() => setShowDriverMenu(!showDriverMenu)}
              className="flex-row items-center gap-1.5 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2"
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={14} color="#2563EB" />
              <Text className="text-primary font-semibold text-sm">
                {selectedDriverId ? driverMap[selectedDriverId] || "Unknown" : "All Drivers"}
              </Text>
              <Ionicons name={showDriverMenu ? "chevron-up" : "chevron-down"} size={14} color="#2563EB" />
            </TouchableOpacity>

            {showDriverMenu && (
              <View className="absolute right-0 top-10 bg-white rounded-2xl border border-border shadow-lg overflow-hidden min-w-[160px]" style={{ zIndex: 999, elevation: 20 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDriverId("");
                    setShowDriverMenu(false);
                  }}
                  className={`px-4 py-3 flex-row items-center gap-2 ${
                    !selectedDriverId ? "bg-primary-50" : "bg-white"
                  }`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={!selectedDriverId ? "#2563EB" : "#64748B"}
                  />
                  <Text className={`text-sm font-medium ${!selectedDriverId ? "text-primary font-bold" : "text-text-primary"}`}>
                    All Drivers
                  </Text>
                  {!selectedDriverId && <Ionicons name="checkmark" size={14} color="#2563EB" />}
                </TouchableOpacity>
                {Object.entries(driverMap).map(([id, name]) => (
                  <TouchableOpacity
                    key={id}
                    onPress={() => {
                      setSelectedDriverId(id);
                      setShowDriverMenu(false);
                    }}
                    className={`px-4 py-3 flex-row items-center gap-2 ${
                      selectedDriverId === id ? "bg-primary-50" : "bg-white"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={selectedDriverId === id ? "#2563EB" : "#64748B"}
                    />
                    <Text className={`text-sm font-medium ${selectedDriverId === id ? "text-primary font-bold" : "text-text-primary"}`}>
                      {name}
                    </Text>
                    {selectedDriverId === id && <Ionicons name="checkmark" size={14} color="#2563EB" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Date Filter */}
      <DateFilterBar
        activePreset={filterPreset}
        onPresetChange={(preset) => {
          setFilterPreset(preset);
          if (preset === "all") {
            setCustomFrom(null);
            setCustomTo(null);
            loadInitialData(); // Fresh fetch
          }
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {/* Content */}
      <SectionList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        sections={transferGroups}
        keyExtractor={(item, index) => String((item as any)._id || (item as any).id || index) + "-" + index}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-5 mb-2 mt-6">
            {title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="px-4">
            <TransferCard tx={item} isManager={isManager} onApprove={handleApprove} onDelete={handleDelete} driverName={driverMap[item.driverId]} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6 items-center flex-row justify-center gap-2">
              <ActivityIndicator size="small" color="#2563EB" />
              <Text className="text-text-secondary text-sm font-medium tracking-wide">Loading more transfers...</Text>
            </View>
          ) : !hasMore && displayedTransfers.length > 0 ? (
            <View className="py-6 items-center">
              <Text className="text-text-secondary/50 text-xs tracking-wide">No more transfers to show</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loadingInitial ? (
            <View className="py-20 items-center justify-center opacity-60">
              <Ionicons name="card-outline" size={64} color="#94A3B8" />
              <Text className="text-text-secondary text-base mt-4 text-center">
                No money transfers found matching filters.
              </Text>
            </View>
          ) : (
            <View className="py-20 items-center justify-center gap-3">
               <ActivityIndicator size="large" color="#2563EB" />
               <Text className="text-text-secondary tracking-widest uppercase text-xs font-bold">Loading transfers...</Text>
            </View>
          )
        }
      />

      {/* FAB - Add Transfer - Available for all roles */}
      <TouchableOpacity
        onPress={() => router.push("/add-transfer")}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg border border-primary-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
