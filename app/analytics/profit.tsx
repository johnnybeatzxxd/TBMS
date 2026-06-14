import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { BarChart } from "react-native-chart-kit";
import { analysisService } from "@/src/api/analysis.service";
import { buildPayloadFromFilters, getInitialFiltersFromParams } from "@/src/utils/analysisFilters";
import { ProfitResponse, ProfitDataItem } from "@/src/types/analysis.types";
import { AnalysisHeader, AnalysisFilterState } from "@/src/components/AnalysisHeader";
import { ANALYSIS_PAGE_SIZE, AnalysisLoadMore, hasMoreAnalysisPages } from "@/src/components/AnalysisLoadMore";
import { formatAnalysisChartLabel, formatAnalysisPeriodLabel } from "@/src/utils/analysisChartLabels";
import { getScrollableChartWidth } from "@/src/utils/analysisChartLayout";
import { AnalyticsExportButton } from "@/src/components/AnalyticsExportButton";
import { AnalyticsValueText } from "@/src/components/AnalyticsValueText";

const screenWidth = Dimensions.get("window").width;
const fmt = (n?: number | null) => (n ?? 0).toLocaleString("en-US");

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
  labelColor: () => "#64748B",
  barPercentage: 0.5,
  decimalCount: 0,
  propsForLabels: { fontSize: 10 },
};

export default function ProfitAnalysisScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfitResponse | null>(null);
  const [profitItems, setProfitItems] = useState<ProfitDataItem[]>([]);
  const [listPage, setListPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<AnalysisFilterState>(() => getInitialFiltersFromParams(params, "week"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setListPage(1);
      try {
        const payload = buildPayloadFromFilters(filters, { page: 1, limit: ANALYSIS_PAGE_SIZE });
        const result = await analysisService.getProfit(payload);
        if (cancelled) return;
        setData(result);
        setProfitItems(result.data || []);
        setListTotal(result.total ?? 0);
      } catch (e) {
        console.error("Failed to load profit analysis:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreAnalysisPages(listPage, listTotal)) return;
    setLoadingMore(true);
    const nextPage = listPage + 1;
    try {
      const payload = buildPayloadFromFilters(filters, { page: nextPage, limit: ANALYSIS_PAGE_SIZE });
      const result = await analysisService.getProfit(payload);
      setProfitItems((prev) => [...prev, ...(result.data || [])]);
      setListPage(nextPage);
    } catch (e) {
      console.error("Failed to load more profit data:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const summary = data?.summary;

  // Bar chart: profit per period
  const chartLabels = profitItems.map((item) => formatAnalysisChartLabel(item.key || "", filters.groupBy));
  const chartData = profitItems.map((item) => item.profit ?? 0);
  const chartWidth = getScrollableChartWidth(chartLabels.length, screenWidth);
  const buildProfitExportRows = () => [
    { section: "Summary", metric: "Revenue", value: summary?.revenue ?? 0 },
    { section: "Summary", metric: "Costs", value: summary?.costs ?? 0 },
    { section: "Summary", metric: "Profit", value: summary?.profit ?? 0 },
    { section: "Summary", metric: "Margin", value: summary?.margin ?? 0 },
    ...profitItems.map((item) => ({
      section: "Breakdown",
      key: item.key,
      label: formatAnalysisPeriodLabel(item.key || "", filters.groupBy),
      revenue: item.revenue ?? 0,
      costs: item.costs ?? 0,
      profit: item.profit ?? 0,
      margin: item.margin ?? 0,
      cashRevenue: item.breakdown?.revenue?.cash ?? 0,
      creditRevenue: item.breakdown?.revenue?.credit ?? 0,
      fuelCost: item.breakdown?.costs?.fuel ?? 0,
      expensesCost: item.breakdown?.costs?.expenses ?? 0,
      roadExpensesCost: item.breakdown?.costs?.roadExpenses ?? 0,
    })),
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      <AnalysisHeader
        title="Profit Analysis"
        icon="chart-line"
        iconColor="#16A34A"
        showBack
        filters={filters}
        onFiltersChange={setFilters}
        groupByOptions={["day", "week", "month", "truck"]}
        defaultGroupBy="week"
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <AnalyticsExportButton
            buildRows={buildProfitExportRows}
            fileName="profit_analysis"
            color="#16A34A"
          />

          {/* Margin Banner */}
          <View className={`rounded-2xl p-5 mb-4 items-center ${(summary?.profit ?? 0) >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <Text className={`text-xs font-bold tracking-widest uppercase mb-1 ${(summary?.profit ?? 0) >= 0 ? "text-green-800" : "text-red-800"}`}>
              Profit Margin
            </Text>
            <AnalyticsValueText className={`font-bold text-4xl ${(summary?.profit ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}>
              {Math.round(summary?.margin ?? 0)}%
            </AnalyticsValueText>
            <Text className={`text-sm mt-1 ${(summary?.profit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${fmt(summary?.profit)} net profit
            </Text>
          </View>

          {/* Revenue vs Costs */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mb-2">
                <MaterialCommunityIcons name="trending-up" size={20} color="#16A34A" />
              </View>
              <AnalyticsValueText className="text-success-600 font-bold text-xl">${fmt(summary?.revenue)}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Revenue</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mb-2">
                <MaterialCommunityIcons name="trending-down" size={20} color="#DC2626" />
              </View>
              <AnalyticsValueText className="text-danger-600 font-bold text-xl">${fmt(summary?.costs)}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Costs</Text>
            </View>
          </View>

          {/* Profit Bar Chart */}
          <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Profit by Period</Text>
            {chartLabels.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={{
                    labels: chartLabels,
                    datasets: [{ data: chartData.length > 0 ? chartData : [0] }],
                  }}
                  width={chartWidth}
                  height={200}
                  chartConfig={chartConfig}
                  fromZero
                  showValuesOnTopOfBars
                  yAxisLabel="$"
                  yAxisSuffix=""
                  style={{ borderRadius: 16 }}
                />
              </ScrollView>
            ) : (
              <Text className="text-text-secondary text-center py-8">No profit data available</Text>
            )}
          </View>

          {/* Period Breakdown */}
          {profitItems.length > 0 && (
            <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Period Details</Text>
              {profitItems.map((item, i) => (
                <View key={i} className="py-4 border-b border-border/50">
                  {/* Period header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                        <Ionicons name="calendar" size={14} color="#2563EB" />
                      </View>
                      <Text className="text-text-primary font-medium text-sm">
                        {formatAnalysisPeriodLabel(item.key || "", filters.groupBy)}
                      </Text>
                    </View>
                    <View className={`px-2.5 py-1 rounded-full ${(item.profit ?? 0) >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <AnalyticsValueText className={`font-bold text-xs ${(item.profit ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {Math.round(item.margin ?? 0)}% margin
                      </AnalyticsValueText>
                    </View>
                  </View>

                  {/* Revenue / Cost / Profit row */}
                  <View className="flex-row gap-2 mb-2">
                    <View className="flex-1 bg-green-50 rounded-xl px-3 py-2 border border-green-100">
                      <Text className="text-green-800 text-xs font-bold">Revenue</Text>
                      <AnalyticsValueText className="text-green-700 font-bold text-sm">${fmt(item.revenue)}</AnalyticsValueText>
                    </View>
                    <View className="flex-1 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                      <Text className="text-red-800 text-xs font-bold">Costs</Text>
                      <AnalyticsValueText className="text-red-700 font-bold text-sm">${fmt(item.costs)}</AnalyticsValueText>
                    </View>
                    <View className={`flex-1 rounded-xl px-3 py-2 border ${(item.profit ?? 0) >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                      <Text className={`text-xs font-bold ${(item.profit ?? 0) >= 0 ? "text-emerald-800" : "text-red-800"}`}>Profit</Text>
                      <AnalyticsValueText className={`font-bold text-sm ${(item.profit ?? 0) >= 0 ? "text-emerald-700" : "text-red-700"}`}>${fmt(item.profit)}</AnalyticsValueText>
                    </View>
                  </View>

                  {item.breakdown?.revenue && (
                    <View className="flex-row gap-2 mb-2">
                      <View className="flex-1 bg-green-50/80 rounded-lg px-2 py-1.5 border border-green-100">
                        <Text className="text-green-800 text-xs font-semibold">Cash</Text>
                        <Text className="text-green-700 text-xs">${fmt(item.breakdown.revenue.cash)}</Text>
                      </View>
                      <View className="flex-1 bg-sky-50/80 rounded-lg px-2 py-1.5 border border-sky-100">
                        <Text className="text-sky-800 text-xs font-semibold">Credit</Text>
                        <Text className="text-sky-700 text-xs">${fmt(item.breakdown.revenue.credit)}</Text>
                      </View>
                    </View>
                  )}

                  {item.breakdown?.costs && (
                    <View className="flex-row gap-2">
                      <View className="flex-1 bg-surface rounded-lg px-2 py-1.5">
                        <Text className="text-text-secondary text-xs">Fuel: ${fmt(item.breakdown.costs.fuel)}</Text>
                      </View>
                      <View className="flex-1 bg-surface rounded-lg px-2 py-1.5">
                        <Text className="text-text-secondary text-xs">Expenses: ${fmt(item.breakdown.costs.expenses)}</Text>
                      </View>
                      <View className="flex-1 bg-surface rounded-lg px-2 py-1.5">
                        <Text className="text-text-secondary text-xs">Road: ${fmt(item.breakdown.costs.roadExpenses)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
              <AnalysisLoadMore
                loadedCount={profitItems.length}
                totalCount={listTotal}
                loading={loadingMore}
                onLoadMore={handleLoadMore}
              />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
