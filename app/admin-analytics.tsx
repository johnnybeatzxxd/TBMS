import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { analysisService } from "@/src/api/analysis.service";
import { buildDashboardPayload, buildPayloadFromFilters, buildAnalysisQueryString } from "@/src/utils/analysisFilters";
import { DashboardResponse, ProfitSummary } from "@/src/types/analysis.types";
import { AnalysisHeader, AnalysisFilterState, DEFAULT_ANALYSIS_FILTERS } from "@/src/components/AnalysisHeader";

const formatCurrency = (n: number) => n.toLocaleString("en-US");

export default function AnalyticsHubScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
  const [filters, setFilters] = useState<AnalysisFilterState>(DEFAULT_ANALYSIS_FILTERS);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const dashboardPayload = buildDashboardPayload(
          filters.preset,
          filters.truckIds,
          filters.customFrom,
          filters.customTo
        );
        const profitPayload = buildPayloadFromFilters(filters);

        const [dashboardData, profitData] = await Promise.all([
          analysisService.getDashboard(dashboardPayload),
          analysisService.getProfit({ ...profitPayload, limit: 1 }),
        ]);

        setDashboard(dashboardData);
        setProfitSummary(profitData.summary);
      } catch (e) {
        console.error("Failed to load dashboard:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  if (loading || !dashboard) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top","bottom"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-text-secondary mt-3 tracking-widest text-xs uppercase font-bold">Loading Analytics...</Text>
      </SafeAreaView>
    );
  }

  const { summary, pending } = dashboard;
  const totalPending = pending.trips + pending.refuels + pending.expenses + pending.transfers;
  const qStr = buildAnalysisQueryString(filters);

  const kpis = [
    { label: "Total Trips", value: summary.totalTripsCount, icon: "truck", color: "#2563EB", bg: "#EFF6FF" },
    { label: "Total Expenses", value: `$${formatCurrency(summary.totalExpensesCost)}`, icon: "receipt", color: "#DC2626", bg: "#FEF2F2" },
    { label: "Fuel Cost", value: `$${formatCurrency(summary.totalFuelCost)}`, icon: "gas-station", color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Driver Expense", value: `$${formatCurrency(summary.totalDriverExpense)}`, icon: "account-cash", color: "#7C3AED", bg: "#F5F3FF" },
  ];

  const financialKpis = profitSummary
    ? [
        { label: "Revenue", value: `$${formatCurrency(profitSummary.revenue)}`, icon: "trending-up", color: "#16A34A", bg: "#F0FDF4" },
        {
          label: "Net Profit",
          value: `$${formatCurrency(profitSummary.profit)}`,
          icon: "cash-multiple",
          color: profitSummary.profit >= 0 ? "#16A34A" : "#DC2626",
          bg: profitSummary.profit >= 0 ? "#F0FDF4" : "#FEF2F2",
        },
        {
          label: "Margin",
          value: `${Math.round(profitSummary.margin)}%`,
          icon: "percent",
          color: "#0EA5E9",
          bg: "#F0F9FF",
        },
      ]
    : [];

  const screens = [
    {
      id: "trips",
      title: "Trip Analysis",
      subtitle: `${summary.cashTripsCount} Cash · ${summary.creditTripsCount} Credit`,
      icon: "truck",
      color: "#2563EB",
      bgColor: "#EFF6FF",
      route: `/analytics/trips${qStr}`,
    },
    {
      id: "expenses",
      title: "Expense Analysis",
      subtitle: `$${formatCurrency(summary.totalExpensesCost)} total · ${summary.expenseCount} entries`,
      icon: "receipt",
      color: "#DC2626",
      bgColor: "#FEF2F2",
      route: `/analytics/expenses${qStr}`,
    },
    {
      id: "refuel",
      title: "Fuel Analysis",
      subtitle: `${summary.refuelCount} refuels · $${formatCurrency(summary.totalFuelCost)}`,
      icon: "gas-station",
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      route: `/analytics/refuel${qStr}`,
    },
    {
      id: "profit",
      title: "Profit Analysis",
      subtitle: profitSummary
        ? `$${formatCurrency(profitSummary.profit)} profit · ${Math.round(profitSummary.margin)}% margin`
        : "Revenue vs costs & margins",
      icon: "chart-line",
      color: "#16A34A",
      bgColor: "#F0FDF4",
      route: `/analytics/profit${qStr}`,
    },
    {
      id: "performance",
      title: "Performance",
      subtitle: "Truck & driver rankings",
      icon: "podium",
      color: "#7C3AED",
      bgColor: "#F5F3FF",
      route: `/analytics/performance${qStr}`,
    },
    {
      id: "compare",
      title: "Compare",
      subtitle: "Side-by-side truck & driver metrics",
      icon: "compare-horizontal",
      color: "#0EA5E9",
      bgColor: "#F0F9FF",
      route: `/analytics/compare${qStr}`,
    },
  ];

  const pendingItems = [
    { label: "Trips", count: pending.trips, icon: "truck-outline", color: "#2563EB" },
    { label: "Refuels", count: pending.refuels, icon: "gas-station-outline", color: "#F59E0B" },
    { label: "Expenses", count: pending.expenses, icon: "receipt", color: "#DC2626" },
    { label: "Transfers", count: pending.transfers, icon: "bank-transfer", color: "#7C3AED" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      <AnalysisHeader
        title="Analytics"
        icon="chart-bar"
        iconColor="#2563EB"
        filters={filters}
        onFiltersChange={setFilters}
        hideGroupBy
        hideDriverFilter
        hideAdvancedFilters
      />

      <ScrollView
        className="flex-1 z-0 elevation-0"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-primary pt-6 pb-20 px-5 rounded-b-[40px]">
          <Text className="text-white/70 text-xs font-semibold tracking-widest uppercase text-center mb-4">
            Business Analytics
          </Text>
          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-white/20 border-4 border-white/30 items-center justify-center mb-3">
              <Ionicons name="bar-chart" size={28} color="#fff" />
            </View>
            <Text className="text-white text-2xl font-bold tracking-wide">Dashboard</Text>
            <Text className="text-white/60 text-sm mt-1">{user?.name}'s Fleet Overview</Text>
          </View>
        </View>

        <View className="px-4 -mt-10">
          <View className="flex-row flex-wrap gap-3">
            {kpis.map((kpi, i) => (
              <View
                key={i}
                className="bg-white rounded-2xl border border-border p-4 shadow-sm items-center"
                style={{ width: (Dimensions.get("window").width - 44) / 2 }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: kpi.bg }}
                >
                  <MaterialCommunityIcons name={kpi.icon as any} size={24} color={kpi.color} />
                </View>
                <Text className="text-text-primary font-bold text-xl">{kpi.value}</Text>
                <Text className="text-text-secondary text-xs mt-0.5">{kpi.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {financialKpis.length > 0 && (
          <View className="px-4 mt-3">
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase ml-1 mb-2">
              Financial Overview
            </Text>
            <View className="flex-row gap-3">
              {financialKpis.map((kpi, i) => (
                <View key={i} className="flex-1 bg-white rounded-2xl border border-border p-3 shadow-sm items-center">
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center mb-1.5"
                    style={{ backgroundColor: kpi.bg }}
                  >
                    <MaterialCommunityIcons name={kpi.icon as any} size={18} color={kpi.color} />
                  </View>
                  <Text className="text-text-primary font-bold text-sm" numberOfLines={1}>
                    {kpi.value}
                  </Text>
                  <Text className="text-text-secondary text-[10px] mt-0.5 text-center">{kpi.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="px-4 mt-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <MaterialCommunityIcons name="cash" size={18} color="#16A34A" />
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">Cash Trips</Text>
              </View>
              <Text className="text-text-primary font-bold text-xl">{summary.cashTripsCount}</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <MaterialCommunityIcons name="credit-card" size={18} color="#0EA5E9" />
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">Credit Trips</Text>
              </View>
              <Text className="text-text-primary font-bold text-xl">{summary.creditTripsCount}</Text>
            </View>
          </View>
        </View>

        {totalPending > 0 && (
          <View className="px-4 mt-4">
            <View className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="time-outline" size={18} color="#F59E0B" />
                <Text className="text-amber-800 text-xs font-bold tracking-widest uppercase">
                  Pending Approvals ({totalPending})
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-3">
                {pendingItems.filter(p => p.count > 0).map((item, i) => (
                  <View key={i} className="flex-row items-center gap-2 bg-white rounded-xl px-3 py-2 border border-amber-100">
                    <MaterialCommunityIcons name={item.icon as any} size={16} color={item.color} />
                    <Text className="text-text-primary text-sm font-medium">{item.count} {item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View className="px-4 mt-6">
          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase ml-1 mb-3">
            Deep Dive
          </Text>
          <View className="gap-3">
            {screens.map((screen) => (
              <TouchableOpacity
                key={screen.id}
                activeOpacity={0.85}
                className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm"
                onPress={() => router.push(screen.route as any)}
              >
                <View className="flex-row items-center p-5 gap-4">
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: screen.bgColor }}
                  >
                    <MaterialCommunityIcons name={screen.icon as any} size={28} color={screen.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-bold text-lg">{screen.title}</Text>
                    <Text className="text-text-secondary text-sm mt-0.5">{screen.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
