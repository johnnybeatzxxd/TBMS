import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { refuelService } from "@/src/api/services";
import { Refuel } from "@/src/types/refuel.types";
import { useAuthStore } from "@/src/store";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const getGroupedData = (data: Refuel[]) => {
  if (!data) return [];
  const grouped = data.reduce((acc, item) => {
    // Normalizing Date grouping to YYYY-MM-DD
    const rawDate = item.date ? item.date.split("T")[0] : new Date().toISOString().split("T")[0];
    if (!acc[rawDate]) acc[rawDate] = [];
    acc[rawDate].push(item);
    return acc;
  }, {} as Record<string, Refuel[]>);

  return Object.entries(grouped).map(([date, t]) => ({
    title: date,
    data: t,
  }));
};

const RefuelCard = ({ refuel }: { refuel: Refuel }) => {
  return (
    <View className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 ${refuel.approved === "APPROVED" ? "bg-success-50" : "bg-amber-50"} rounded-xl items-center justify-center mr-3`}>
            <Ionicons name="water" size={20} color={refuel.approved === "APPROVED" ? "#16A34A" : "#F59E0B"} />
          </View>
          <View>
            <Text className="text-text-primary font-bold text-base">Fuel Refill</Text>
            <Text className="text-text-secondary text-xs mt-0.5">{refuel.liters} Liters</Text>
          </View>
        </View>
        <View className="items-end">
           <Text className={`${refuel.approved === "APPROVED" ? "text-success-600" : "text-amber-600"} font-bold text-lg`}>${typeof refuel.price === "number" ? refuel.price.toFixed(2) : refuel.price}</Text>
           <Text className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${refuel.approved === "APPROVED" ? "text-success-600" : "text-amber-500"}`}>
             {refuel.approved || "PENDING"}
           </Text>
        </View>
      </View>
    </View>
  );
};

export default function DriverRefuelsScreen() {
  const { user } = useAuthStore();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRefuels = async (pageNum: number, append = false, isRefresh = false) => {
    if (pageNum === 1 && !isRefresh) setLoadingInitial(true);
    else if (pageNum > 1) setLoadingMore(true);

    try {
      const response = await refuelService.getRefuels({
        page: pageNum,
        perpage: 10,
      });

      setRefuels(prev => append ? [...prev, ...response.refuels] : response.refuels);
      setPage(response.meta.currentPage);
      setHasMore(response.meta.currentPage < response.meta.totalPages);
    } catch (error: any) {
      console.log("Error loading driver refuels:", error);
      setHasMore(false);
    } finally {
      if (pageNum === 1) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRefuels(1, false, true);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchRefuels(1, false);
    }, [])
  );

  const handleLoadMore = () => {
    if (!loadingMore && !loadingInitial && hasMore) {
      fetchRefuels(page + 1, true);
    }
  };

  const sections = getGroupedData(refuels);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm z-50">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="gas-station" size={26} color="#F59E0B" />
        <Text className="text-text-primary font-bold text-xl ml-2">My Refuels</Text>
      </View>

      {loadingInitial ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <SectionList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
          sections={sections}
          keyExtractor={(item, index) => (item._id || (item as any).id) + index}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1 mt-6">
              {title}
            </Text>
          )}
          renderItem={({ item }) => <RefuelCard refuel={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center flex-row justify-center gap-2">
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text className="text-text-secondary text-sm">Loading...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
               <Text className="text-text-secondary">No refuels logged yet.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/add-refuel")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-amber-500 rounded-full items-center justify-center shadow-lg border border-amber-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
