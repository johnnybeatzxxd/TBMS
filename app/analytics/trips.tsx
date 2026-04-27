import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { PieChart, BarChart } from "react-native-chart-kit";
import { mockAnalyticsService, AnalyticsTrip } from "@/src/api/mock/analytics.mock";

const screenWidth = Dimensions.get("window").width;
const formatCurrency = (n: number) => n.toLocaleString("en-US");

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
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<AnalyticsTrip[]>([]);

  const params = useLocalSearchParams();
  const truckId = params.truckId as string | undefined;
  const preset = params.preset as string | undefined;
  const customFromStr = params.customFrom as string | undefined;
  const customToStr = params.customTo as string | undefined;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await mockAnalyticsService.getTrips({
        truckId,
        preset: preset as any,
        customFrom: customFromStr ? new Date(customFromStr) : null,
        customTo: customToStr ? new Date(customToStr) : null,
      });
      setTrips(res.trips);
      setLoading(false);
    })();
  }, [truckId, preset, customFromStr, customToStr]);

  const stats = useMemo(() => {
    const totalTrips = trips.reduce((s, t) => s + t.numberOfTrips, 0);
    const cashTrips = trips.filter(t => t.paymentMethod === "CASH");
    const dispatchTrips = trips.filter(t => t.paymentMethod === "DISPATCH");
    const cashRevenue = cashTrips.reduce((s, t) => s + (t.amount || 0), 0);
    const totalRoadExp = trips.reduce((s, t) => s + t.roadExpence, 0);
    const mc10 = trips.filter(t => t.volume === "MCUBE10").length;
    const mc16 = trips.filter(t => t.volume === "MCUBE16").length;

    // Daily trip counts for bar chart (last 7 days)
    const dailyMap: Record<string, number> = {};
    trips.forEach(t => {
      dailyMap[t.date] = (dailyMap[t.date] || 0) + t.numberOfTrips;
    });
    const sortedDates = Object.keys(dailyMap).sort().slice(-7);
    const dailyLabels = sortedDates.map(d => d.slice(5)); // MM-DD
    const dailyData = sortedDates.map(d => dailyMap[d]);

    return {
      totalTrips, cashCount: cashTrips.length, dispatchCount: dispatchTrips.length,
      cashRevenue, totalRoadExp, mc10, mc16, dailyLabels, dailyData,
    };
  }, [trips]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  const paymentPieData = [
    { name: "Cash", count: stats.cashCount, color: "#16A34A", legendFontColor: "#334155", legendFontSize: 13 },
    { name: "Dispatch", count: stats.dispatchCount, color: "#2563EB", legendFontColor: "#334155", legendFontSize: 13 },
  ];

  const volumePieData = [
    { name: "10 M³", count: stats.mc10, color: "#0EA5E9", legendFontColor: "#334155", legendFontSize: 13 },
    { name: "16 M³", count: stats.mc16, color: "#F59E0B", legendFontColor: "#334155", legendFontSize: 13 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="truck" size={24} color="#2563EB" />
        <Text className="text-text-primary font-bold text-xl ml-2">Trip Analysis</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* KPI Row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-primary font-bold text-3xl">{stats.totalTrips}</Text>
            <Text className="text-text-secondary text-xs mt-1">Total Trips</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-success-600 font-bold text-xl">${formatCurrency(stats.cashRevenue)}</Text>
            <Text className="text-text-secondary text-xs mt-1">Cash Revenue</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-danger-600 font-bold text-xl">${formatCurrency(stats.totalRoadExp)}</Text>
            <Text className="text-text-secondary text-xs mt-1">Road Expense</Text>
          </View>
        </View>

        {/* Trips per Day Bar Chart */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Trips Per Day (Last 7 Days)</Text>
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
              yAxisLabel=""
              yAxisSuffix=""
              style={{ borderRadius: 16 }}
            />
          ) : (
            <Text className="text-text-secondary text-center py-8">No trip data available</Text>
          )}
        </View>

        {/* Payment Method Breakdown Pie */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Payment Method</Text>
          <PieChart
            data={paymentPieData}
            width={screenWidth - 64}
            height={180}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Volume Breakdown Pie */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Volume Distribution</Text>
          <PieChart
            data={volumePieData}
            width={screenWidth - 64}
            height={180}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Top Routes */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Top Routes</Text>
          {(() => {
            const routeMap: Record<string, number> = {};
            trips.forEach(t => {
              const key = `${t.loadingSite} → ${t.destinationSite}`;
              routeMap[key] = (routeMap[key] || 0) + t.numberOfTrips;
            });
            const sorted = Object.entries(routeMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
            return sorted.map(([route, count], i) => (
              <View key={i} className="flex-row items-center justify-between py-3 border-b border-border/50">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                    <Text className="text-primary font-bold text-sm">{i + 1}</Text>
                  </View>
                  <Text className="text-text-primary text-sm font-medium flex-1" numberOfLines={1}>{route}</Text>
                </View>
                <View className="px-2.5 py-1 bg-primary-50 rounded-full">
                  <Text className="text-primary font-bold text-xs">{count} trips</Text>
                </View>
              </View>
            ));
          })()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
