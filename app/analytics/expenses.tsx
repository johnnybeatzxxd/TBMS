import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from "react-native";
import { useCachedFetch } from "@/src/hooks/useCachedFetch";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { BarChart } from "react-native-chart-kit";
import { analysisService } from "@/src/api/analysis.service";
import { buildPayloadFromFilters, getInitialFiltersFromParams } from "@/src/utils/analysisFilters";
import { ExpensesResponse, ExpensesBreakdownItem } from "@/src/types/analysis.types";
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
  color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
  labelColor: () => "#64748B",
  barPercentage: 0.5,
  decimalCount: 0,
  propsForLabels: { fontSize: 10 },
};

const CATEGORY_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  roadExpenses: { color: "#2563EB", bg: "#EFF6FF", icon: "road-variant" },
  salary: { color: "#16A34A", bg: "#F0FDF4", icon: "account-cash" },
  perdiem: { color: "#7C3AED", bg: "#F5F3FF", icon: "food" },
  fuelExpense: { color: "#0EA5E9", bg: "#F0F9FF", icon: "gas-station" },
  serviceType: { color: "#F59E0B", bg: "#FFFBEB", icon: "wrench" },
  otherExpensesTotal: { color: "#64748B", bg: "#F8FAFC", icon: "dots-horizontal" },
};

const buildExpenseCategories = (summary?: ExpensesResponse["summary"]) => {
  if (!summary) return [];
  const total = summary.total ?? 0;
  const rows = [
    { key: "roadExpenses", name: "Road Expenses", amount: summary.driverExpense?.roadExpenses ?? 0 },
    { key: "salary", name: "Salary", amount: summary.driverExpense?.salary ?? 0 },
    { key: "perdiem", name: "Perdiem", amount: summary.driverExpense?.perdiem ?? 0 },
    { key: "fuelExpense", name: "Fuel Expense", amount: summary.fuelExpense ?? 0 },
    ...(summary.truckExpenses?.byServiceType || []).map((item) => ({
      key: "serviceType",
      name: item.serviceTypeName || "Service Type",
      amount: item.total ?? 0,
    })),
    {
      key: "otherExpensesTotal",
      name: "Other Truck Expenses",
      amount: summary.truckExpenses?.otherExpensesTotal ?? 0,
    },
  ];

  return rows
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((row) => ({
      ...row,
      pct: total > 0 ? Math.round((row.amount / total) * 100) : 0,
      ...(CATEGORY_COLORS[row.key] || CATEGORY_COLORS.otherExpensesTotal),
    }));
};

const describeExpenseBreakdown = (item: ExpensesBreakdownItem) => {
  const labels = buildExpenseCategories(item).map((cat) => cat.name);
  return labels.length > 0 ? labels.join(", ") : "No expenses";
};

export default function ExpensesAnalysisScreen() {
  const params = useLocalSearchParams();
  const [data, setData] = useState<ExpensesResponse | null>(null);
  const [breakdownItems, setBreakdownItems] = useState<ExpensesBreakdownItem[]>([]);
  const [breakdownPage, setBreakdownPage] = useState(1);
  const [breakdownTotal, setBreakdownTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<AnalysisFilterState>(() => getInitialFiltersFromParams(params, "day"));

  const fetchExpenses = useCallback(async () => {
    const payload = buildPayloadFromFilters(filters, { page: 1, limit: ANALYSIS_PAGE_SIZE });
    const expensesData = await analysisService.getExpenses(payload);
    return { expensesData };
  }, [filters]);

  const { data: cachedData, isLoading, refetch } = useCachedFetch<{ expensesData: ExpensesResponse } | null>(
    `EXPENSES_ANALYSIS_${JSON.stringify(filters)}`,
    fetchExpenses,
    null,
    { alwaysFetch: true }
  );

  useEffect(() => {
    if (cachedData) {
      setData(cachedData.expensesData);
      setBreakdownItems(cachedData.expensesData.breakdown?.data || []);
      setBreakdownTotal(cachedData.expensesData.breakdown?.total ?? 0);
      setBreakdownPage(1);
    }
  }, [cachedData]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreAnalysisPages(breakdownPage, breakdownTotal)) return;
    setLoadingMore(true);
    const nextPage = breakdownPage + 1;
    try {
      const payload = buildPayloadFromFilters(filters, { page: nextPage, limit: ANALYSIS_PAGE_SIZE });
      const result = await analysisService.getExpenses(payload);
      setBreakdownItems((prev) => [...prev, ...(result.breakdown?.data || [])]);
      setBreakdownPage(nextPage);
    } catch (e) {
      console.error("Failed to load more expenses:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  const summary = data?.summary;

  const chartLabels = breakdownItems.map((item) => formatAnalysisChartLabel(item.key || "", filters.groupBy));
  const chartData = breakdownItems.map((item) => item.total ?? 0);
  const chartWidth = getScrollableChartWidth(chartLabels.length, screenWidth);

  const categories = buildExpenseCategories(summary);
  const topCategory = categories[0];
  const buildExpensesExportRows = () => [
    { section: "Summary", metric: "Total", value: summary?.total ?? 0 },
    { section: "Driver Expense", metric: "Total", value: summary?.driverExpense?.total ?? 0 },
    { section: "Driver Expense", metric: "Road Expenses", value: summary?.driverExpense?.roadExpenses ?? 0 },
    { section: "Driver Expense", metric: "Salary", value: summary?.driverExpense?.salary ?? 0 },
    { section: "Driver Expense", metric: "Perdiem", value: summary?.driverExpense?.perdiem ?? 0 },
    { section: "Fuel Expense", metric: "Fuel Expense", value: summary?.fuelExpense ?? 0 },
    { section: "Truck Expense", metric: "Total", value: summary?.truckExpenses?.total ?? 0 },
    { section: "Truck Expense", metric: "Other Expenses", value: summary?.truckExpenses?.otherExpensesTotal ?? 0 },
    ...(summary?.truckExpenses?.byServiceType || []).map((item) => ({
      section: "Truck Expense",
      serviceTypeId: item.serviceTypeId,
      metric: item.serviceTypeName,
      value: item.total ?? 0,
    })),
    ...breakdownItems.map((item) => ({
      section: "Breakdown",
      key: item.key,
      label: formatAnalysisPeriodLabel(item.key || "", filters.groupBy),
      total: item.total ?? 0,
      driverExpense: item.driverExpense?.total ?? 0,
      roadExpenses: item.driverExpense?.roadExpenses ?? 0,
      salary: item.driverExpense?.salary ?? 0,
      perdiem: item.driverExpense?.perdiem ?? 0,
      fuelExpense: item.fuelExpense ?? 0,
      truckExpenses: item.truckExpenses?.total ?? 0,
      otherTruckExpenses: item.truckExpenses?.otherExpensesTotal ?? 0,
    })),
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      <AnalysisHeader
        title="Expense Analysis"
        icon="receipt"
        iconColor="#DC2626"
        showBack
        filters={filters}
        onFiltersChange={setFilters}
        groupByOptions={["day", "week", "month", "truck", "driver"]}
      />

      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DC2626" />
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
              colors={["#DC2626"]}
              tintColor="#DC2626"
            />
          }
        >
          <AnalyticsExportButton
            buildRows={buildExpensesExportRows}
            fileName="expense_analysis"
            color="#DC2626"
          />

          {/* KPI Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-danger-600 font-bold text-2xl">${fmt(summary?.total)}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Total Spent</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-text-primary font-bold text-lg">
                {topCategory ? topCategory.name : "None"}
              </AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">
                {topCategory ? `$${fmt(topCategory.amount)} (${topCategory.pct}%)` : "Top Category"}
              </Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <AnalyticsValueText className="text-amber-600 font-bold text-2xl">{fmt(breakdownTotal)}</AnalyticsValueText>
              <Text className="text-text-secondary text-xs mt-1">Breakdown Rows</Text>
            </View>
          </View>

          {/* Category Breakdown */}
          <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Expense Categories</Text>
            {categories.map((cat, i) => (
              <View key={i} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: cat.bg }}
                    >
                      <MaterialCommunityIcons name={cat.icon as any} size={16} color={cat.color} />
                    </View>
                    <Text className="text-text-primary text-sm font-medium">{cat.name}</Text>
                  </View>
                  <Text className="text-text-secondary text-xs">${fmt(cat.amount)} ({cat.pct}%)</Text>
                </View>
                <View className="h-3 bg-surface rounded-full overflow-hidden ml-10">
                  <View className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                </View>
              </View>
            ))}
            {categories.length === 0 && (
              <Text className="text-text-secondary text-center py-4">No expenses for this filter</Text>
            )}
          </View>

          {/* Expense Bar Chart */}
          <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Spending Breakdown</Text>
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
              <Text className="text-text-secondary text-center py-8">No expense data available</Text>
            )}
          </View>

          {/* Breakdown List */}
          {breakdownItems.length > 0 && (
            <View className="bg-white rounded-2xl border border-border p-4 shadow-sm">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Details</Text>
              {breakdownItems.map((item, i) => {
                return (
                  <View key={`${item.key}-${i}`} className="flex-row items-center justify-between py-3 border-b border-border/50">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                        <Ionicons name="calendar" size={14} color="#DC2626" />
                      </View>
                      <View>
                        <Text className="text-text-primary text-sm font-medium">
                          {formatAnalysisPeriodLabel(item.key || "", filters.groupBy)}
                        </Text>
                        <Text className="text-text-secondary text-xs">{describeExpenseBreakdown(item)}</Text>
                      </View>
                    </View>
                    <AnalyticsValueText className="text-danger-600 font-bold text-sm">${fmt(item.total)}</AnalyticsValueText>
                  </View>
                );
              })}
              <AnalysisLoadMore
                loadedCount={breakdownItems.length}
                totalCount={breakdownTotal}
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
