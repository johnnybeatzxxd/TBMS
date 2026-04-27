import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LineChart, PieChart } from "react-native-chart-kit";
import { mockAnalyticsService, AnalyticsRefuel } from "@/src/api/mock/analytics.mock";

const screenWidth = Dimensions.get("window").width;
const formatCurrency = (n: number) => n.toLocaleString("en-US");

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
  const [loading, setLoading] = useState(true);
  const [refuels, setRefuels] = useState<AnalyticsRefuel[]>([]);

  const params = useLocalSearchParams();
  const truckId = params.truckId as string | undefined;
  const preset = params.preset as string | undefined;
  const customFromStr = params.customFrom as string | undefined;
  const customToStr = params.customTo as string | undefined;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await mockAnalyticsService.getRefuels({
        truckId,
        preset: preset as any,
        customFrom: customFromStr ? new Date(customFromStr) : null,
        customTo: customToStr ? new Date(customToStr) : null,
      });
      setRefuels(res.refuels);
      setLoading(false);
    })();
  }, [truckId, preset, customFromStr, customToStr]);

  const stats = useMemo(() => {
    const totalCost = refuels.reduce((s, r) => s + r.price, 0);
    const totalVol = refuels.reduce((s, r) => s + r.vol, 0);
    const avgCostPerLiter = totalVol > 0 ? Math.round(totalCost / totalVol) : 0;
    const avgPerRefuel = refuels.length > 0 ? Math.round(totalCost / refuels.length) : 0;

    // Group by truck
    const truckCost: Record<string, number> = {};
    const truckVol: Record<string, number> = {};
    refuels.forEach(r => {
      truckCost[r.truckId] = (truckCost[r.truckId] || 0) + r.price;
      truckVol[r.truckId] = (truckVol[r.truckId] || 0) + r.vol;
    });

    // Daily cost for line chart (last 10 data points)
    const dailyMap: Record<string, number> = {};
    refuels.forEach(r => {
      dailyMap[r.date] = (dailyMap[r.date] || 0) + r.price;
    });
    const sortedDates = Object.keys(dailyMap).sort().slice(-10);
    const lineLabels = sortedDates.map(d => d.slice(5));
    const lineData = sortedDates.map(d => dailyMap[d]);

    // Pie for truck cost distribution
    const truckPie = Object.entries(truckCost).map(([id, cost], i) => ({
      name: id.replace("trk_", "Truck "),
      cost,
      color: i === 0 ? "#F59E0B" : "#0EA5E9",
      legendFontColor: "#334155",
      legendFontSize: 13,
    }));

    return { totalCost, totalVol, avgCostPerLiter, avgPerRefuel, truckCost, truckVol, lineLabels, lineData, truckPie };
  }, [refuels]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="gas-station" size={24} color="#F59E0B" />
        <Text className="text-text-primary font-bold text-xl ml-2">Refuel Analysis</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* KPI Row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-amber-600 font-bold text-2xl">${formatCurrency(stats.totalCost)}</Text>
            <Text className="text-text-secondary text-xs mt-1">Total Cost</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-sky-600 font-bold text-2xl">{formatCurrency(stats.totalVol)}L</Text>
            <Text className="text-text-secondary text-xs mt-1">Total Volume</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-text-primary font-bold text-xl">${stats.avgCostPerLiter}/L</Text>
            <Text className="text-text-secondary text-xs mt-1">Avg Cost/Liter</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-text-primary font-bold text-xl">${formatCurrency(stats.avgPerRefuel)}</Text>
            <Text className="text-text-secondary text-xs mt-1">Avg Per Refuel</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <Text className="text-text-primary font-bold text-xl">{refuels.length}</Text>
            <Text className="text-text-secondary text-xs mt-1">Total Refuels</Text>
          </View>
        </View>

        {/* Fuel Cost Over Time - Line Chart */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Fuel Cost Over Time</Text>
          {stats.lineLabels.length > 0 ? (
            <LineChart
              data={{
                labels: stats.lineLabels,
                datasets: [{ data: stats.lineData }],
              }}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 16 }}
              yAxisLabel="$"
              yAxisSuffix=""
            />
          ) : (
            <Text className="text-text-secondary text-center py-8">No refuel data available</Text>
          )}
        </View>

        {/* Cost by Truck - Pie Chart */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Cost by Truck</Text>
          <PieChart
            data={stats.truckPie}
            width={screenWidth - 64}
            height={180}
            chartConfig={chartConfig}
            accessor="cost"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Refuel Log */}
        <View className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">Recent Refuels</Text>
          {refuels.slice(0, 8).map((r, i) => (
            <View key={r.id} className="flex-row items-center justify-between py-3 border-b border-border/50">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-9 h-9 rounded-full bg-amber-50 items-center justify-center">
                  <MaterialCommunityIcons name="gas-station" size={16} color="#F59E0B" />
                </View>
                <View>
                  <Text className="text-text-primary text-sm font-medium">{r.truckId.replace("trk_", "Truck ")}</Text>
                  <Text className="text-text-secondary text-xs">{r.date} · {r.vol}L</Text>
                </View>
              </View>
              <Text className="text-amber-600 font-bold text-sm">${formatCurrency(r.price)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
