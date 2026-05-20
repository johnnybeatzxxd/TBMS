import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { transferService } from "@/src/api/services";
import { Transfer } from "@/src/types/transfer.types";
import { useAuthStore } from "@/src/store";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useCachedFetch } from "@/src/hooks/useCachedFetch";

const getGroupedData = (data: Transfer[]) => {
  const grouped = data.reduce((acc, item) => {
    // Standardize date to "YYYY-MM-DD" if it contains time
    const dateStr = item.date.split("T")[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {} as Record<string, Transfer[]>);

  return Object.entries(grouped).map(([date, t]) => ({
    title: date,
    data: t,
  }));
};

const TransferCard = ({ transfer, userName }: { transfer: Transfer, userName?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const isIncrement = transfer.sender === "ADMIN" || (transfer.sender as any) === "manager";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm p-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isIncrement ? "bg-success-50" : "bg-danger-50"}`}>
            <Ionicons name={isIncrement ? "arrow-down" : "arrow-up"} size={20} color={isIncrement ? "#16A34A" : "#DC2626"} />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>{transfer.remark}</Text>
            <Text className="text-text-secondary text-xs mt-0.5">Authorizer: {transfer.sender}</Text>
          </View>
        </View>
        <View className="items-end">
           <Text className={`${isIncrement ? "text-success-600" : "text-danger-600"} font-bold text-lg`}>
             {isIncrement ? "+" : "-"}${typeof transfer.amount === "number" ? transfer.amount.toFixed(2) : transfer.amount}
           </Text>
           <View className="flex-row items-center mt-1">
             <View className={`px-2 py-0.5 rounded mr-2 ${transfer.status === "APPROVED" || (transfer as any).approved === "APPROVED" ? "bg-success-100" : "bg-amber-100"}`}>
               <Text className={`text-[10px] font-bold uppercase tracking-wider ${transfer.status === "APPROVED" || (transfer as any).approved === "APPROVED" ? "text-success-700" : "text-amber-700"}`}>
                 {transfer.status || (transfer as any).approved || "PENDING"}
               </Text>
             </View>
             <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color="#94A3B8" />
           </View>
        </View>
      </View>

      {expanded && (
        <View className="mt-3 pt-3 border-t border-border/50">
          <View className="bg-surface rounded-xl p-3 border border-border/50 mb-2 gap-2">
            <View className="flex-row items-center justify-between">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Driver</Text>
               <Text className="text-text-primary text-sm font-medium">{userName || transfer.driverId || "N/A"}</Text>
            </View>
            <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Sender</Text>
               <Text className="text-text-primary text-sm font-medium">{transfer.sender}</Text>
            </View>
            <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Date</Text>
               <Text className="text-text-primary text-sm font-medium">{transfer.date ? transfer.date.split("T")[0] : "N/A"}</Text>
            </View>
            <View className="flex-col pt-2 border-t border-border/30 gap-1">
               <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Remark</Text>
               <Text className="text-text-primary text-[13px] leading-5">{transfer.remark || "N/A"}</Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function DriverTransfersScreen() {
  const { user } = useAuthStore();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPageOne = useCallback(async () => {
    const response = await transferService.getTransfers({
      page: 1,
      perpage: 10,
      driverId: user?.id,
    });
    return response;
  }, [user?.id]);

  const { data: pageOneRes, isLoading: isPageOneLoading, refetch } = useCachedFetch<any>(
    "DRIVER_TRANSFERS",
    fetchPageOne,
    null
  );

  useEffect(() => {
    if (pageOneRes) {
      setTransfers(pageOneRes.transfers);
      setPage(pageOneRes.meta.currentPage);
      setHasMore(pageOneRes.meta.currentPage < pageOneRes.meta.totalPages);
      setLoadingInitial(false);
    } else if (isPageOneLoading) {
      setLoadingInitial(true);
    }
  }, [pageOneRes, isPageOneLoading]);

  const fetchTransfers = async (pageNum: number, append = false) => {
    setLoadingMore(true);
    try {
      const response = await transferService.getTransfers({
        page: pageNum,
        perpage: 10,
        driverId: user?.id,
      });

      setTransfers(prev => append ? [...prev, ...response.transfers] : response.transfers);
      setPage(response.meta.currentPage);
      setHasMore(response.meta.currentPage < response.meta.totalPages);
    } catch (error: any) {
      console.log("Error loading transfers:", error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch(true);
    setRefreshing(false);
  };

  // Automatically reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      const { useAuthStore } = require("@/src/store/authStore");
      if (!useAuthStore.getState().isAuthenticated) return;
      refetch(false);
    }, [refetch])
  );

  const handleLoadMore = () => {
    if (!loadingMore && !loadingInitial && hasMore) {
      fetchTransfers(page + 1, true);
    }
  };

  const sections = getGroupedData(transfers);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm z-50">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="bank-transfer" size={26} color="#16A34A" />
        <Text className="text-text-primary font-bold text-xl ml-2">My Transfers</Text>
      </View>

      {loadingInitial ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <SectionList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}
          sections={sections}
          keyExtractor={(item, index) => (item._id || (item as any).id) + index}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1 mt-6">
              {title}
            </Text>
          )}
          renderItem={({ item }) => <TransferCard transfer={item} userName={user?.name} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center flex-row justify-center gap-2">
                <ActivityIndicator size="small" color="#16A34A" />
                <Text className="text-text-secondary text-sm">Loading...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
               <Text className="text-text-secondary">No transfers logged yet.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/add-transfer")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-success-600 rounded-full items-center justify-center shadow-lg border border-success-700 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
