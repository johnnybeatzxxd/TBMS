import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { analysisService } from "@/src/api/analysis.service";
import { buildPayloadFromFilters, getInitialFiltersFromParams } from "@/src/utils/analysisFilters";
import { PerformanceItem } from "@/src/types/analysis.types";
import { AnalysisHeader, AnalysisFilterState } from "@/src/components/AnalysisHeader";

const fmt = (n?: number | null) => (n ?? 0).toLocaleString("en-US");

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#CD7F32"]; // gold, silver, bronze

export default function PerformanceScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PerformanceItem[]>([]);
  const [entityGroupBy, setEntityGroupBy] = useState<"truck" | "driver">("truck");
  const [filters, setFilters] = useState<AnalysisFilterState>(() => getInitialFiltersFromParams(params, "day"));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const basePayload = buildPayloadFromFilters(filters);
        const result = await analysisService.getPerformance({
          groupBy: entityGroupBy,
          truckIds: basePayload.truckIds,
          startDate: basePayload.startDate,
          endDate: basePayload.endDate,
        });
        setItems(result.data || []);
      } catch (e) {
        console.error("Failed to load performance:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters, entityGroupBy]);

  // Sort by revenue descending for ranking
  const ranked = [...items].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
  const maxRevenue = ranked.length > 0 ? (ranked[0].revenue ?? 1) : 1;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      <AnalysisHeader
        title="Performance"
        icon="podium"
        iconColor="#7C3AED"
        showBack
        filters={filters}
        onFiltersChange={setFilters}
        hideGroupBy
        hideDriverFilter
        hideAdvancedFilters
      />

      {/* Toggle: Truck vs Driver */}
      <View className="flex-row mx-4 mt-3 mb-1 bg-white rounded-xl border border-border overflow-hidden">
        <TouchableOpacity
          onPress={() => setEntityGroupBy("truck")}
          className={`flex-1 py-3 items-center ${entityGroupBy === "truck" ? "bg-primary" : "bg-white"}`}
        >
          <Text className={`font-semibold text-sm ${entityGroupBy === "truck" ? "text-white" : "text-text-secondary"}`}>
            By Truck
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setEntityGroupBy("driver")}
          className={`flex-1 py-3 items-center ${entityGroupBy === "driver" ? "bg-primary" : "bg-white"}`}
        >
          <Text className={`font-semibold text-sm ${entityGroupBy === "driver" ? "text-white" : "text-text-secondary"}`}>
            By Driver
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {ranked.length === 0 && (
            <View className="bg-white rounded-2xl border border-border p-8 shadow-sm items-center">
              <MaterialCommunityIcons name="chart-bar" size={48} color="#CBD5E1" />
              <Text className="text-text-secondary text-sm mt-3">No performance data available</Text>
            </View>
          )}

          {ranked.map((item, i) => {
            const revenueBarPct = maxRevenue > 0 ? Math.round(((item.revenue ?? 0) / maxRevenue) * 100) : 0;
            const medalColor = i < 3 ? MEDAL_COLORS[i] : "#CBD5E1";

            return (
              <View key={i} className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-3">
                {/* Rank + Name */}
                <View className="flex-row items-center gap-3 mb-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: i < 3 ? `${medalColor}20` : "#F1F5F9" }}
                  >
                    {i < 3 ? (
                      <MaterialCommunityIcons name="trophy" size={20} color={medalColor} />
                    ) : (
                      <Text className="text-text-secondary font-bold text-sm">#{i + 1}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-bold text-lg">{item.entity}</Text>
                    <Text className="text-text-secondary text-xs">{fmt(item.totalTrips)} trips · {fmt(item.approvalRate)}% approved</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-success-600 font-bold text-lg">${fmt(item.revenue)}</Text>
                    <Text className="text-text-secondary text-xs">revenue</Text>
                  </View>
                </View>

                {/* Revenue bar */}
                <View className="h-2 bg-surface rounded-full overflow-hidden mb-3">
                  <View className="h-full bg-primary rounded-full" style={{ width: `${revenueBarPct}%` }} />
                </View>

                {/* Stats grid */}
                <View className="flex-row flex-wrap gap-2">
                  <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
                    <Text className="text-text-secondary text-xs">Approval</Text>
                    <Text className="text-text-primary font-bold text-sm">{fmt(item.approvalRate)}%</Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
                    <Text className="text-text-secondary text-xs">Road Exp Ratio</Text>
                    <Text className="text-text-primary font-bold text-sm">{(item.roadExpenseToRevnueRatio ?? 0).toFixed(1)}%</Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
                    <Text className="text-text-secondary text-xs">L/Trip</Text>
                    <Text className="text-text-primary font-bold text-sm">{(item.litersPerTrip ?? 0).toFixed(1)}</Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
                    <Text className="text-text-secondary text-xs">Total Fuel</Text>
                    <Text className="text-text-primary font-bold text-sm">{fmt(item.liters)}L</Text>
                  </View>
                  <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
                    <Text className="text-text-secondary text-xs">Fuel Efficiency</Text>
                    <Text className="text-text-primary font-bold text-sm">
                      {item.fuelEfficiency != null ? `${item.fuelEfficiency.toFixed(1)} km/L` : "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
