import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { mockAnalyticsService } from "@/src/api/mock/analytics.mock";
import { DateFilterBar, DateFilterPreset } from "@/src/components/DateFilterBar";
import { mockTruckService } from "@/src/api/mock/trucks.mock";

const formatCurrency = (n: number) => n.toLocaleString("en-US");

export default function AnalyticsHubScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  // Filters State
  const [trucks, setTrucks] = useState<any[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<any>({ id: "all", plateNumber: "All Trucks" });
  const [showTruckMenu, setShowTruckMenu] = useState(false);

  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const res = await mockTruckService.getMyTrucks();
      if ("trucks" in res) {
        setTrucks([{ id: "all", plateNumber: "All Trucks" }, ...res.trucks]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await mockAnalyticsService.getSummary({
        truckId: selectedTruck.id,
        preset: filterPreset,
        customFrom,
        customTo,
      });
      setSummary(data);
      setLoading(false);
    })();
  }, [selectedTruck, filterPreset, customFrom, customTo]);

  if (loading || !summary) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-text-secondary mt-3 tracking-widest text-xs uppercase font-bold">Loading Analytics...</Text>
      </SafeAreaView>
    );
  }

  const kpis = [
    { label: "Total Trips", value: summary.totalTrips, icon: "truck", color: "#2563EB", bg: "#EFF6FF" },
    { label: "Cash Revenue", value: `$${formatCurrency(summary.totalCashRevenue)}`, icon: "cash", color: "#16A34A", bg: "#F0FDF4" },
    { label: "Refuel Cost", value: `$${formatCurrency(summary.totalRefuelCost)}`, icon: "gas-station", color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Expenses", value: `$${formatCurrency(summary.totalDriverExpense)}`, icon: "receipt", color: "#DC2626", bg: "#FEF2F2" },
  ];

  // Convert params to URL query string for deep dives
  const queryParams = new URLSearchParams();
  if (selectedTruck.id !== "all") queryParams.append("truckId", selectedTruck.id);
  if (filterPreset) queryParams.append("preset", filterPreset);
  if (customFrom) queryParams.append("customFrom", customFrom.toISOString());
  if (customTo) queryParams.append("customTo", customTo.toISOString());
  const qStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const screens = [
    {
      id: "trips",
      title: "Trip Analysis",
      subtitle: `${summary.cashTripCount} Cash · ${summary.dispatchTripCount} Dispatch`,
      icon: "truck",
      color: "#2563EB",
      bgColor: "#EFF6FF",
      route: `/analytics/trips${qStr}`,
    },
    {
      id: "expenses",
      title: "Expense Analysis",
      subtitle: `$${formatCurrency(summary.totalDriverExpense)} total spent`,
      icon: "receipt",
      color: "#DC2626",
      bgColor: "#FEF2F2",
      route: `/analytics/expenses${qStr}`,
    },
    {
      id: "refuel",
      title: "Refuel Analysis",
      subtitle: `${formatCurrency(summary.totalRefuelVol)}L · $${formatCurrency(summary.totalRefuelCost)}`,
      icon: "gas-station",
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      route: `/analytics/refuel${qStr}`,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header With Dropdown */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 bg-white border-b border-border shadow-sm z-50 elevation-10">
        <View className="flex-row items-center">
          <Ionicons name="bar-chart" size={26} color="#2563EB" />
          <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide">Analytics</Text>
        </View>
        <View className="relative z-50">
          <TouchableOpacity
            onPress={() => setShowTruckMenu((v) => !v)}
            className="flex-row items-center gap-1.5 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2"
            activeOpacity={0.8}
          >
            <Ionicons name="car-sport" size={14} color="#2563EB" />
            <Text className="text-primary font-semibold text-sm">{selectedTruck.plateNumber}</Text>
            <Ionicons name={showTruckMenu ? "chevron-up" : "chevron-down"} size={14} color="#2563EB" />
          </TouchableOpacity>

          {showTruckMenu && (
            <View className="absolute right-0 top-10 bg-white rounded-2xl border border-border shadow-lg overflow-hidden min-w-[160px] z-[999] elevation-20">
              {trucks.map((truck) => (
                <TouchableOpacity
                  key={truck.id}
                  onPress={() => {
                    setSelectedTruck(truck);
                    setShowTruckMenu(false);
                  }}
                  className={`px-4 py-3 flex-row items-center gap-2 ${
                    selectedTruck.id === truck.id ? "bg-primary-50" : "bg-white"
                  }`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={truck.id === "all" ? "apps-outline" : "car-sport-outline"}
                    size={16}
                    color={selectedTruck.id === truck.id ? "#2563EB" : "#64748B"}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      selectedTruck.id === truck.id ? "text-primary font-bold" : "text-text-primary"
                    }`}
                  >
                    {truck.plateNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Date Filters beneath header */}
      <View className="bg-white z-1 elevation-0 border-b border-border shadow-sm">
        <DateFilterBar
          activePreset={filterPreset}
          onPresetChange={setFilterPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
      </View>

      <ScrollView
        className="flex-1 z-0 elevation-0"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Visual */}
        <View className="bg-primary pt-6 pb-20 px-5 rounded-b-[40px]">
          <Text className="text-white/70 text-xs font-semibold tracking-widest uppercase text-center mb-4">
            Business Analytics
          </Text>
          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-white/20 border-4 border-white/30 items-center justify-center mb-3">
              <Ionicons name="bar-chart" size={28} color="#fff" />
            </View>
            <Text className="text-white text-2xl font-bold tracking-wide">
              Dashboard
            </Text>
            <Text className="text-white/60 text-sm mt-1">
              {user?.name}'s Fleet Overview
            </Text>
          </View>
        </View>

        {/* KPI Cards */}
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

        {/* Road Expense + Refuel Volume Row */}
        <View className="px-4 mt-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="car-outline" size={18} color="#7C3AED" />
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">Road Expense</Text>
              </View>
              <Text className="text-text-primary font-bold text-xl">${formatCurrency(summary.totalRoadExpense)}</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <MaterialCommunityIcons name="water" size={18} color="#0EA5E9" />
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">Total Fuel</Text>
              </View>
              <Text className="text-text-primary font-bold text-xl">{formatCurrency(summary.totalRefuelVol)}L</Text>
            </View>
          </View>
        </View>

        {/* Deep Dive Navigation */}
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
