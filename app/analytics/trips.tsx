import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from "react-native";
import { useCachedFetch } from "@/src/hooks/useCachedFetch";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { BarChart } from "react-native-chart-kit";
import { analysisService } from "@/src/api/analysis.service";
import { buildPayloadFromFilters, getInitialFiltersFromParams } from "@/src/utils/analysisFilters";
import { TripsSummaryResponse, RouteItem, TripBreakdownItem } from "@/src/types/analysis.types";
import { AnalysisHeader, AnalysisFilterState } from "@/src/components/AnalysisHeader";
import { ANALYSIS_PAGE_SIZE, AnalysisLoadMore, hasMoreAnalysisPages } from "@/src/components/AnalysisLoadMore";
import { formatAnalysisChartLabel, formatAnalysisPeriodLabel } from "@/src/utils/analysisChartLabels";
import { AnalyticsExportButton } from "@/src/components/AnalyticsExportButton";
import { AnalyticsValueText } from "@/src/components/AnalyticsValueText";

const screenWidth = Dimensions.get("window").width;
const fmt = (n?: number | null) => (n ?? 0).toLocaleString("en-US");

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: () => "#64748B",
  barPercentage: 0.6,
  decimalCount: 0,
  propsForLabels: { fontSize: 11 },
};

export default function TripsAnalysisScreen() {
  const params = useLocalSearchParams();
  const [data, setData] = useState<TripsSummaryResponse | null>(null);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [breakdownItems, setBreakdownItems] = useState<TripBreakdownItem[]>([]);
  const [breakdownPage, setBreakdownPage] = useState(1);
  const [breakdownTotal, setBreakdownTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<AnalysisFilterState>(() => getInitialFiltersFromParams(params, "day"));

  const fetchTrips = useCallback(async () => {
    const payload = buildPayloadFromFilters(filters, { page: 1, limit: ANALYSIS_PAGE_SIZE });
    const [tripData, routeData] = await Promise.all([
      analysisService.getTripsSummary(payload),
      analysisService.getRoutes(buildPayloadFromFilters(filters)),
    ]);
    return { tripData, routeData };
  }, [filters]);

  const { data: cachedData, isLoading, refetch } = useCachedFetch<{ tripData: TripsSummaryResponse; routeData: any } | null>(
    `TRIP_ANALYSIS_${JSON.stringify(filters)}`,
    fetchTrips,
    null,
    { alwaysFetch: true }
  );

  useEffect(() => {
    if (cachedData) {
      setData(cachedData.tripData);
      setBreakdownItems(cachedData.tripData.breakdown?.data || []);
      setBreakdownTotal(cachedData.tripData.breakdown?.total ?? 0);
      setRoutes(cachedData.routeData.data || []);
      setBreakdownPage(1);
    }
  }, [cachedData]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreAnalysisPages(breakdownPage, breakdownTotal)) return;
    setLoadingMore(true);
    const nextPage = breakdownPage + 1;
    try {
      const payload = buildPayloadFromFilters(filters, { page: nextPage, limit: ANALYSIS_PAGE_SIZE });
      const tripData = await analysisService.getTripsSummary(payload);
      setBreakdownItems((prev) => [...prev, ...(tripData.breakdown?.data || [])]);
      setBreakdownPage(nextPage);
    } catch (e) {
      console.error("Failed to load more trips:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const summary = data?.summary;
  const totalRoadExpenses = (summary?.cashTrips?.roadExpenses ?? 0) + (summary?.creditTrips?.roadExpenses ?? 0);
  const totalTripsCount = summary?.totalTripsCount ?? 0;
  const averageTruckExpensePerTrip = totalTripsCount > 0
    ? (summary?.totalTruckExpence ?? 0) / totalTripsCount
    : 0;
  const averageFuelCostPerTrip = totalTripsCount > 0
    ? (summary?.totalFuelCost ?? 0) / totalTripsCount
    : 0;

  const chartLabels = breakdownItems.map((item) => formatAnalysisChartLabel(item.key || "", filters.groupBy));
  const chartData = breakdownItems.map((item) => item.totalTripsCount ?? 0);
  const buildTripExportRows = () => [
    { section: "Summary", metric: "Total Trips", value: summary?.totalTripsCount ?? 0 },
    { section: "Summary", metric: "Total Revenue", value: (summary?.cashTrips?.totalAmount ?? 0) + (summary?.creditTrips?.totalAmount ?? 0) },
    { section: "Summary", metric: "Road Expense", value: totalRoadExpenses },
    { section: "Summary", metric: "Total Profit", value: summary?.totalProfit ?? 0 },
    { section: "Summary", metric: "Average Profit Per Trip", value: summary?.averageProfitPerTrip ?? 0 },
    { section: "Payment", metric: "Cash Trips", value: summary?.cashTrips?.count ?? 0, amount: summary?.cashTrips?.totalAmount ?? 0 },
    { section: "Payment", metric: "Credit Trips", value: summary?.creditTrips?.count ?? 0, amount: summary?.creditTrips?.totalAmount ?? 0 },
    { section: "Expenses", metric: "Driver Expense", value: summary?.totalDriverExpense ?? 0, averagePerTrip: summary?.averageDriverExpensePerTrip ?? 0 },
    { section: "Expenses", metric: "Truck Expense", value: summary?.totalTruckExpence ?? 0, averagePerTrip: averageTruckExpensePerTrip },
    { section: "Expenses", metric: "Fuel Cost", value: summary?.totalFuelCost ?? 0, averagePerTrip: averageFuelCostPerTrip, litersPerTrip: summary?.averageFuelUsagePerTrip ?? 0 },
    ...breakdownItems.map((item) => ({
      section: "Breakdown",
      key: item.key,
      label: formatAnalysisPeriodLabel(item.key || "", filters.groupBy),
      totalTrips: item.totalTripsCount ?? 0,
      approvedTrips: item.approvedTripsCount ?? 0,
      profit: item.totalProfit ?? 0,
      fuelCost: item.totalFuelCost ?? 0,
      driverExpense: item.totalDriverExpense ?? 0,
      truckExpense: item.totalTruckExpence ?? 0,
    })),
    ...routes.map((route) => ({
      section: "Routes",
      loadingSite: route.loadingSite,
      destinationSite: route.destinationSite,
      totalTrips: route.totalTripsCount,
      cashTrips: route.cashTripsCount,
      creditTrips: route.creditTripsCount,
    })),
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      <AnalysisHeader
        title="Trip Analysis"
        icon="truck"
        iconColor="#2563EB"
        showBack
        filters={filters}
        onFiltersChange={setFilters}
        groupByOptions={["day", "week", "month", "truck", "driver"]}
      />

      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
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
              colors={["#2563EB"]}
              tintColor="#2563EB"
            />
          }
        >
          <AnalyticsExportButton
            buildRows={buildTripExportRows}
            fileName="trip_analysis"
            color="#2563EB"
          />

          {/* KPI Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-primary font-bold text-3xl">{fmt(summary?.totalTripsCount)}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Total Trips</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-success-600 font-bold text-lg">${fmt((summary?.cashTrips?.totalAmount ?? 0) + (summary?.creditTrips?.totalAmount ?? 0))}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Total Revenue</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-danger-600 font-bold text-lg">${fmt(totalRoadExpenses)}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Road Expense</Text>
            </View>
          </View>

          {/* Profit & Averages */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className={`font-bold text-xl ${(summary?.totalProfit ?? 0) >= 0 ? "text-success-600" : "text-danger-600"}`}>
                ${fmt(summary?.totalProfit)}
              </AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Total Profit</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-text-primary font-bold text-xl">${fmt(Math.round(summary?.averageProfitPerTrip ?? 0))}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Avg Profit/Trip</Text>
            </View>
          </View>

          {/* Cash vs Credit Breakdown */}
          <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Payment Breakdown</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
                <Text className="text-green-800 text-xs font-bold uppercase tracking-widest mb-1">Cash</Text>
                <AnalyticsValueText className="text-green-700 font-bold text-lg">{fmt(summary?.cashTrips?.count)} trips</AnalyticsValueText>
                <Text className="text-green-600 text-sm">${fmt(summary?.cashTrips?.totalAmount)}</Text>
              </View>
              <View className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-100">
                <Text className="text-blue-800 text-xs font-bold uppercase tracking-widest mb-1">Credit</Text>
                <AnalyticsValueText className="text-blue-700 font-bold text-lg">{fmt(summary?.creditTrips?.count)} trips</AnalyticsValueText>
                <Text className="text-blue-600 text-sm">${fmt(summary?.creditTrips?.totalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* Expense Breakdown */}
          <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Expense Breakdown</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-red-50 rounded-xl p-3 border border-red-100">
                <Text className="text-red-800 text-xs font-bold uppercase tracking-widest mb-1">Driver</Text>
                <AnalyticsValueText className="text-red-700 font-bold text-lg">${fmt(summary?.totalDriverExpense)}</AnalyticsValueText>
                <Text className="text-red-500 text-xs">Avg ${fmt(Math.round(summary?.averageDriverExpensePerTrip ?? 0))}/trip</Text>
              </View>
              <View className="flex-1 bg-orange-50 rounded-xl p-3 border border-orange-100">
                <Text className="text-orange-800 text-xs font-bold uppercase tracking-widest mb-1">Truck</Text>
                <AnalyticsValueText className="text-orange-700 font-bold text-lg">${fmt(summary?.totalTruckExpence)}</AnalyticsValueText>
                <Text className="text-orange-500 text-xs">Avg ${fmt(Math.round(averageTruckExpensePerTrip))}/trip</Text>
              </View>
              <View className="flex-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
                <Text className="text-amber-800 text-xs font-bold uppercase tracking-widest mb-1">Fuel</Text>
                <AnalyticsValueText className="text-amber-700 font-bold text-lg">${fmt(summary?.totalFuelCost)}</AnalyticsValueText>
                <Text className="text-amber-500 text-xs">
                  Avg ${fmt(Math.round(averageFuelCostPerTrip))}/trip · {fmt(Math.round(summary?.averageFuelUsagePerTrip ?? 0))}L
                </Text>
              </View>
            </View>
          </View>

          {/* Trips per Day Bar Chart */}
          <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Trips Breakdown</Text>
            {chartLabels.length > 0 ? (
              <BarChart
                data={{
                  labels: chartLabels,
                  datasets: [{ data: chartData.length > 0 ? chartData : [0] }],
                }}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                fromZero
                showValuesOnTopOfBars
                yAxisLabel=""
                yAxisSuffix=""
                style={{ borderRadius: 16 }}
              />
            ) : (
              <Text className="text-text-secondary text-center py-8">No trip data available</Text>
            )}
          </View>

          {/* Breakdown List */}
          {breakdownItems.length > 0 && (
            <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Breakdown Details</Text>
              {breakdownItems.map((item, i) => (
                <View key={`${item.key}-${i}`} className="flex-row items-center justify-between py-3 border-b border-border/50">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                      <Ionicons name="calendar" size={14} color="#2563EB" />
                    </View>
                    <View>
                      <Text className="text-text-primary text-sm font-medium">
                        {formatAnalysisPeriodLabel(item.key || "", filters.groupBy)}
                      </Text>
                      <Text className="text-text-secondary text-xs">{fmt(item.totalTripsCount)} trips · {fmt(item.approvedTripsCount)} approved</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <AnalyticsValueText className={`font-bold text-sm ${(item.totalProfit ?? 0) >= 0 ? "text-success-600" : "text-danger-600"}`}>
                      ${fmt(item.totalProfit)}
                    </AnalyticsValueText>
                    <Text className="text-text-secondary text-xs">profit</Text>
                  </View>
                </View>
              ))}
              <AnalysisLoadMore
                loadedCount={breakdownItems.length}
                totalCount={breakdownTotal}
                loading={loadingMore}
                onLoadMore={handleLoadMore}
              />
            </View>
          )}

          {/* Top Routes */}
          {routes.length > 0 && (
            <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Top Routes</Text>
              {routes.slice(0, 5).map((route, i) => (
                <View key={i} className="flex-row items-center justify-between py-3 border-b border-border/50">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                      <Text className="text-primary font-bold text-sm">{i + 1}</Text>
                    </View>
                    <Text className="text-text-primary text-sm font-medium flex-1" numberOfLines={1}>
                      {route.loadingSite} → {route.destinationSite}
                    </Text>
                  </View>
                  <View className="items-end">
                    <View className="px-2.5 py-1 bg-primary-50 rounded-full">
                      <Text className="text-primary font-bold text-xs">{fmt(route.totalTripsCount)} trips</Text>
                    </View>
                    <Text className="text-text-secondary text-xs mt-1">
                      {fmt(route.cashTripsCount)}C · {fmt(route.creditTripsCount)}Cr
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
