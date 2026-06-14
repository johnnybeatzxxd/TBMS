import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from "react-native";
import { useCachedFetch } from "@/src/hooks/useCachedFetch";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import { analysisService } from "@/src/api/analysis.service";
import { truckService } from "@/src/api/truck.service";
import { buildPayloadFromFilters, getInitialFiltersFromParams } from "@/src/utils/analysisFilters";
import { formatAnalysisChartLabel, formatAnalysisPeriodLabel } from "@/src/utils/analysisChartLabels";
import { getScrollableChartWidth } from "@/src/utils/analysisChartLayout";
import { FuelUsageResponse, FuelListItem } from "@/src/types/analysis.types";
import { AnalysisHeader, AnalysisFilterState } from "@/src/components/AnalysisHeader";
import { ANALYSIS_PAGE_SIZE, AnalysisLoadMore, hasMoreAnalysisPages } from "@/src/components/AnalysisLoadMore";
import { AnalyticsExportButton } from "@/src/components/AnalyticsExportButton";
import { AnalyticsValueText } from "@/src/components/AnalyticsValueText";

const screenWidth = Dimensions.get("window").width;
const fmt = (n?: number | null) => (n ?? 0).toLocaleString("en-US");

const getFuelBreakdownMetrics = (item: FuelUsageResponse["breakdown"]["data"][number]) => {
  const liters = item.totalLiters ?? item.liters ?? 0;
  const cost = item.totalCost ?? item.cost ?? 0;
  const hasTotalTrips = item.totalTrips !== undefined;
  const count = hasTotalTrips ? item.totalTrips ?? 0 : item.count ?? 0;
  const averageFuelPrice = item.averageFuelPrice ?? item.avgPricePerLiter ?? 0;

  return {
    liters,
    cost,
    count,
    countLabel: hasTotalTrips ? "trips" : "records",
    averageFuelPrice,
  };
};

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
  labelColor: () => "#64748B",
  decimalCount: 0,
  propsForLabels: { fontSize: 10 },
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#F59E0B" },
};

export default function RefuelAnalysisScreen() {
  const params = useLocalSearchParams();
  const [usage, setUsage] = useState<FuelUsageResponse | null>(null);
  const [fuelList, setFuelList] = useState<FuelListItem[]>([]);
  const [listPage, setListPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [truckPlates, setTruckPlates] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<AnalysisFilterState>(() => getInitialFiltersFromParams(params, "day"));

  const fetchRefuel = useCallback(async () => {
    const usagePayload = buildPayloadFromFilters(filters);
    const listPayload = buildPayloadFromFilters(filters, { page: 1, limit: ANALYSIS_PAGE_SIZE });
    const selectedTruckId = filters.truckIds.length === 1 ? filters.truckIds[0] : null;

    const usageData = await analysisService.getFuelUsage(usagePayload);
    const listData = selectedTruckId
      ? await analysisService.getFuelList({
          truckId: selectedTruckId,
          driverId: listPayload.driverId,
          startDate: listPayload.startDate,
          endDate: listPayload.endDate,
          page: 1,
          limit: ANALYSIS_PAGE_SIZE,
        })
      : { data: [], total: 0, page: 1, limit: ANALYSIS_PAGE_SIZE };
    return { usageData, listData };
  }, [filters]);

  const { data: cachedData, isLoading, refetch } = useCachedFetch<{ usageData: FuelUsageResponse; listData: any } | null>(
    `REFUEL_ANALYSIS_${JSON.stringify(filters)}`,
    fetchRefuel,
    null,
    { alwaysFetch: true }
  );

  useEffect(() => {
    if (cachedData) {
      setUsage(cachedData.usageData);
      setFuelList(cachedData.listData.data || []);
      setListTotal(cachedData.listData.total ?? 0);
      setListPage(1);
    }
  }, [cachedData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await truckService.getMyTrucks();
        if ("trucks" in res) {
          setTruckPlates(Object.fromEntries(res.trucks.map((t) => [t.id, t.plateNumber])));
        }
      } catch (e) {
        console.error("Failed to load trucks for fuel list:", e);
      }
    })();
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreAnalysisPages(listPage, listTotal)) return;
    setLoadingMore(true);
    const nextPage = listPage + 1;
    try {
      const payload = buildPayloadFromFilters(filters, { page: nextPage, limit: ANALYSIS_PAGE_SIZE });
      const selectedTruckId = filters.truckIds.length === 1 ? filters.truckIds[0] : null;
      if (!selectedTruckId) return;
      const listData = await analysisService.getFuelList({
        truckId: selectedTruckId,
        driverId: payload.driverId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        page: nextPage,
        limit: ANALYSIS_PAGE_SIZE,
      });
      setFuelList((prev) => [...prev, ...(listData.data || [])]);
      setListPage(nextPage);
    } catch (e) {
      console.error("Failed to load more refuels:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const summary = usage?.summary;
  const breakdown = usage?.breakdown;
  const selectedTruckId = filters.truckIds.length === 1 ? filters.truckIds[0] : null;

  // Build line chart data from breakdown
  const lineLabels = (breakdown?.data || []).map((item) =>
    formatAnalysisChartLabel(item.key || "", filters.groupBy)
  );
  const lineData = (breakdown?.data || []).map((item) => getFuelBreakdownMetrics(item).cost);
  const chartWidth = getScrollableChartWidth(lineLabels.length, screenWidth);
  const buildFuelExportRows = () => [
    { section: "Summary", metric: "Total Cost", value: summary?.totalCost ?? 0 },
    { section: "Summary", metric: "Total Liters", value: summary?.totalLiters ?? 0 },
    { section: "Summary", metric: "Total Trips", value: summary?.totalTrips ?? 0 },
    { section: "Summary", metric: "Average Fuel Price", value: summary?.averageFuelPrice ?? 0 },
    { section: "Summary", metric: "Fuel Cost Per Trip", value: summary?.fuleCostPerTrip ?? 0 },
    { section: "Summary", metric: "Fuel Usage Per Trip", value: summary?.fuelUsagePerTrip ?? 0 },
    ...(breakdown?.data || []).map((item) => {
      const metrics = getFuelBreakdownMetrics(item);
      return {
        section: "Usage Breakdown",
        key: item.key,
        label: formatAnalysisPeriodLabel(item.key || "", filters.groupBy),
        liters: metrics.liters,
        cost: metrics.cost,
        count: metrics.count,
        countLabel: metrics.countLabel,
        averageFuelPrice: metrics.averageFuelPrice,
      };
    }),
    ...fuelList.map((item) => ({
      section: "Fuel Intervals",
      startDate: item.startDate,
      endDate: item.endDate,
      truckId: selectedTruckId || "",
      truckPlate: selectedTruckId ? truckPlates[selectedTruckId] || "" : "",
      totalFuelLiters: item.totalFuelLiters,
      kmDriven: item.kmDriven,
      totalCost: item.totalCost,
      fuelCostPerKm: item.fuelCostPerKm ?? "",
      averageFuelPrice: item.averageFuelPrice,
      tripsCount: item.tripsCount,
      litersPerKm: item.litersPerKm ?? "",
    })),
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      <AnalysisHeader
        title="Fuel Analysis"
        icon="gas-station"
        iconColor="#F59E0B"
        showBack
        filters={filters}
        onFiltersChange={setFilters}
        groupByOptions={["day", "week", "month", "truck", "driver"]}
      />

      {isLoading && !usage ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refetch(true)}
              colors={["#F59E0B"]}
              tintColor="#F59E0B"
            />
          }
        >
          <AnalyticsExportButton
            buildRows={buildFuelExportRows}
            fileName="fuel_analysis"
            color="#F59E0B"
          />

          {/* KPI Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-amber-600 font-bold text-2xl">${fmt(summary?.totalCost)}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Total Cost</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-sky-600 font-bold text-2xl">{fmt(summary?.totalLiters)}L</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Total Volume</Text>
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-text-primary font-bold text-xl">${fmt(Math.round(summary?.averageFuelPrice ?? 0))}/L</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Avg Price/Liter</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-text-primary font-bold text-xl">${fmt(Math.round(summary?.fuleCostPerTrip ?? 0))}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Fuel Cost/Trip</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-text-primary font-bold text-xl">{fmt(Math.round(summary?.fuelUsagePerTrip ?? 0))}L</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Liters/Trip</Text>
            </View>
          </View>

          {/* Fuel Cost Over Time - Line Chart */}
          <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Fuel Cost Over Time</Text>
            {lineLabels.length > 0 && lineData.some(d => d > 0) ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={{
                    labels: lineLabels,
                    datasets: [{ data: lineData.length > 0 ? lineData : [0] }],
                  }}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{ borderRadius: 16 }}
                  yAxisLabel="$"
                  yAxisSuffix=""
                />
              </ScrollView>
            ) : (
              <Text className="text-text-secondary text-center py-8">No fuel data available</Text>
            )}
          </View>

          {/* Fuel Usage Breakdown */}
          {(breakdown?.data || []).length > 0 && (
            <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Usage Breakdown</Text>
              {(breakdown?.data || []).map((item, i) => {
                const metrics = getFuelBreakdownMetrics(item);
                return (
                  <View key={i} className="flex-row items-center justify-between py-3 border-b border-border/50">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-9 h-9 rounded-full bg-amber-50 items-center justify-center">
                        <Ionicons name="calendar" size={14} color="#F59E0B" />
                      </View>
                      <View>
                        <Text className="text-text-primary text-sm font-medium">
                          {formatAnalysisPeriodLabel(item.key || "", filters.groupBy)}
                        </Text>
                        <Text className="text-text-secondary text-xs">
                          {fmt(metrics.liters)}L · {fmt(metrics.count)} {metrics.countLabel}
                          {metrics.averageFuelPrice ? ` · $${fmt(Math.round(metrics.averageFuelPrice))}/L` : ""}
                        </Text>
                      </View>
                    </View>
                    <AnalyticsValueText className="text-amber-600 font-bold text-sm">${fmt(metrics.cost)}</AnalyticsValueText>
                  </View>
                );
              })}
            </View>
          )}

          {/* Fuel Interval Log */}
          {fuelList.length > 0 && (
            <View className="bg-white rounded-2xl border border-border p-4 shadow-sm">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Fuel Intervals</Text>
              {fuelList.map((r, i) => (
                <View key={`${r.startDate}-${r.endDate}-${i}`} className="flex-row items-center justify-between py-3 border-b border-border/50">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-9 h-9 rounded-full bg-amber-50 items-center justify-center">
                      <MaterialCommunityIcons name="gas-station" size={16} color="#F59E0B" />
                    </View>
                    <View>
                      <Text className="text-text-primary text-sm font-medium">
                        {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                      </Text>
                      <Text className="text-text-secondary text-xs">
                        {selectedTruckId && truckPlates[selectedTruckId] ? `${truckPlates[selectedTruckId]} · ` : ""}
                        {fmt(r.totalFuelLiters)}L · {fmt(r.kmDriven)} km · {fmt(r.tripsCount)} trips
                        {r.litersPerKm != null ? ` · ${r.litersPerKm.toFixed(2)} L/km` : ""}
                        {r.fuelCostPerKm != null ? ` · $${fmt(Math.round(r.fuelCostPerKm))}/km` : ""}
                      </Text>
                    </View>
                  </View>
                  <AnalyticsValueText className="text-amber-600 font-bold text-sm">${fmt(r.totalCost)}</AnalyticsValueText>
                </View>
              ))}
              <AnalysisLoadMore
                loadedCount={fuelList.length}
                totalCount={listTotal}
                loading={loadingMore}
                onLoadMore={handleLoadMore}
              />
            </View>
          )}

          {!selectedTruckId && (
            <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
              <Text className="text-text-secondary text-sm text-center">
                Select one truck to view full-tank fuel intervals.
              </Text>
            </View>
          )}

          {/* Empty state */}
          {fuelList.length === 0 && (breakdown?.data || []).length === 0 && selectedTruckId && (
            <View className="bg-white rounded-2xl border border-border p-8 shadow-sm items-center">
              <MaterialCommunityIcons name="gas-station-off" size={48} color="#CBD5E1" />
              <Text className="text-text-secondary text-sm mt-3">No refuel data for this period</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
