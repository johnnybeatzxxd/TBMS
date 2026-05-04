import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { BarChart } from "react-native-chart-kit";
import { mockAnalyticsService, AnalyticsDriverExpense } from "@/src/api/mock/analytics.mock";

const screenWidth = Dimensions.get("window").width;
const formatCurrency = (n: number) => n.toLocaleString("en-US");

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
  labelColor: () => "#64748B",
  barPercentage: 0.5,
  decimalCount: 0,
  propsForLabels: { fontSize: 10 },
};

export default function ExpensesAnalysisScreen() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<AnalyticsDriverExpense[]>([]);

  const params = useLocalSearchParams();
  const truckId = params.truckId as string | undefined;
  const preset = params.preset as string | undefined;
  const customFromStr = params.customFrom as string | undefined;
  const customToStr = params.customTo as string | undefined;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await mockAnalyticsService.getDriverExpenses({
        truckId,
        preset: preset as any,
        customFrom: customFromStr ? new Date(customFromStr) : null,
        customTo: customToStr ? new Date(customToStr) : null,
      });
      setExpenses(res.expenses);
      setLoading(false);
    })();
  }, [truckId, preset, customFromStr, customToStr]);

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const avg = expenses.length > 0 ? Math.round(total / expenses.length) : 0;
    const max = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;
    const maxItem = expenses.find(e => e.amount === max);

    // Group by truck
    const truckMap: Record<string, number> = {};
    expenses.forEach(e => {
      truckMap[e.truckId] = (truckMap[e.truckId] || 0) + e.amount;
    });

    // Daily totals for bar chart (last 7 unique dates)
    const dailyMap: Record<string, number> = {};
    expenses.forEach(e => {
      dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
    });
    const sortedDates = Object.keys(dailyMap).sort().slice(-7);
    const dailyLabels = sortedDates.map(d => d.slice(5));
    const dailyData = sortedDates.map(d => dailyMap[d]);

    // Group by remark category
    const remarkMap: Record<string, number> = {};
    expenses.forEach(e => {
      remarkMap[e.remark] = (remarkMap[e.remark] || 0) + e.amount;
    });
    const topRemarks = Object.entries(remarkMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    return { total, avg, max, maxItem, truckMap, dailyLabels, dailyData, topRemarks };
  }, [expenses]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top","bottom"]}>
        <ActivityIndicator size="large" color="#DC2626" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <Ionicons name="receipt" size={24} color="#DC2626" />
        <Text className="text-text-primary font-bold text-xl ml-2">Expense Analysis</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* KPI Row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-danger-600 font-bold text-2xl">${formatCurrency(stats.total)}</Text>
            <Text className="text-text-secondary text-xs mt-1">Total Spent</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-text-primary font-bold text-2xl">${formatCurrency(stats.avg)}</Text>
            <Text className="text-text-secondary text-xs mt-1">Avg / Entry</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-amber-600 font-bold text-2xl">{expenses.length}</Text>
            <Text className="text-text-secondary text-xs mt-1">Total Entries</Text>
          </View>
        </View>

        {/* Highest single expense */}
        {stats.maxItem && (
          <View className="bg-red-50 rounded-2xl border border-red-200 p-4 mb-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
              <Ionicons name="warning" size={20} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Text className="text-red-800 text-xs font-bold uppercase tracking-widest">Highest Expense</Text>
              <Text className="text-red-900 font-bold text-lg mt-0.5">${formatCurrency(stats.max)} — {stats.maxItem.remark}</Text>
            </View>
          </View>
        )}

        {/* Daily Expense Bar Chart */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Daily Spending (Last 7 Days)</Text>
          {stats.dailyLabels.length > 0 ? (
            <BarChart
              data={{
                labels: stats.dailyLabels,
                datasets: [{ data: stats.dailyData }],
              }}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel="$"
              yAxisSuffix=""
              style={{ borderRadius: 16 }}
            />
          ) : (
            <Text className="text-text-secondary text-center py-8">No expense data available</Text>
          )}
        </View>

        {/* Expense by Truck */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Expense by Truck</Text>
          {Object.entries(stats.truckMap).map(([truckId, amount]) => {
            const pct = stats.total > 0 ? Math.round((amount / stats.total) * 100) : 0;
            return (
              <View key={truckId} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-text-primary text-sm font-medium">{truckId}</Text>
                  <Text className="text-text-secondary text-xs">${formatCurrency(amount)} ({pct}%)</Text>
                </View>
                <View className="h-3 bg-surface rounded-full overflow-hidden">
                  <View className="h-full bg-danger-500 rounded-full" style={{ width: `${pct}%` }} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Top Expense Categories */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Top Categories</Text>
          {stats.topRemarks.map(([remark, amount], i) => (
            <View key={i} className="flex-row items-center justify-between py-3 border-b border-border/50">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                  <Text className="text-danger-600 font-bold text-sm">{i + 1}</Text>
                </View>
                <Text className="text-text-primary text-sm font-medium flex-1" numberOfLines={1}>{remark}</Text>
              </View>
              <Text className="text-danger-600 font-bold text-sm">${formatCurrency(amount)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
