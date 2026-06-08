import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Modal, TextInput, Alert, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { analysisService } from "@/src/api/analysis.service";
import { buildDashboardPayload, buildPayloadFromFilters, buildAnalysisQueryString } from "@/src/utils/analysisFilters";
import { DashboardResponse, ProfitSummary } from "@/src/types/analysis.types";
import { AnalysisHeader, AnalysisFilterState, DEFAULT_ANALYSIS_FILTERS } from "@/src/components/AnalysisHeader";
import DateTimePicker from "@react-native-community/datetimepicker";
import { shareCSV } from "@/src/utils/export";
import { companyService, driverService, truckService } from "@/src/api/services";
import { useCachedFetch } from "@/src/hooks/useCachedFetch";

const formatCurrency = (n: number) => n.toLocaleString("en-US");

const toStartOfDayIso = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const toEndOfDayIso = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

export default function AnalyticsHubScreen() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<AnalysisFilterState>(DEFAULT_ANALYSIS_FILTERS);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReport, setExportReport] = useState<"refules" | "trips" | "expenses" | "moneyTransfer" | "fuel">("trips");
  
  // Dynamic Data Lists
  const [exportTrucks, setExportTrucks] = useState<{ id: string; plateNumber: string }[]>([]);
  const [exportDrivers, setExportDrivers] = useState<{ id: string; name: string }[]>([]);
  const [exportCompanies, setExportCompanies] = useState<{ id: string; name: string }[]>([]);

  // Selected Export Filters
  const [exportSelectedTruckId, setExportSelectedTruckId] = useState<string>("");
  const [exportSelectedDriverId, setExportSelectedDriverId] = useState<string>("");
  const [exportStartDate, setExportStartDate] = useState<Date | null>(null);
  const [exportEndDate, setExportEndDate] = useState<Date | null>(null);
  const [exportStartDateStr, setExportStartDateStr] = useState("");
  const [exportEndDateStr, setExportEndDateStr] = useState("");
  
  // Specific Filters
  const [exportTripType, setExportTripType] = useState<"CASH" | "CREDIT">("CASH");
  const [exportCompanyId, setExportCompanyId] = useState<string>("");
  const [exportTags, setExportTags] = useState<string>("");

  // Loading / Dropdown UI States
  const [exporting, setExporting] = useState(false);
  const [showExportFromPicker, setShowExportFromPicker] = useState(false);
  const [showExportToPicker, setShowExportToPicker] = useState(false);

  // Stable reference for the date picker fallback to prevent Android UI reset on re-renders
  const [fallbackDate] = useState(new Date());

  useEffect(() => {
    if (showExportModal) {
      // Fetch Trucks
      truckService.getMyTrucks().then(res => {
        if ("trucks" in res) {
          setExportTrucks(res.trucks.map((t: any) => ({ id: t.id, plateNumber: t.plateNumber })));
        }
      }).catch(err => console.log("Export trucks load failed", err));

      // Fetch Drivers
      driverService.getMyDrivers().then(res => {
        setExportDrivers(res.drivers.map((d: any) => ({ id: d.id, name: d.name })));
      }).catch(err => console.log("Export drivers load failed", err));

      // Fetch Companies
      companyService.getCompanies().then(res => {
        setExportCompanies(res.map((c: any) => ({ id: c.id, name: c.name })));
      }).catch(err => console.log("Export companies load failed", err));
    }
  }, [showExportModal]);

  const handleTriggerExport = async () => {
    setExporting(true);
    try {
      const payload: any = {
        report: exportReport,
      };

      if (exportSelectedTruckId) {
        payload.truckIds = [exportSelectedTruckId];
      }
      if (exportSelectedDriverId) {
        payload.driverId = exportSelectedDriverId;
      }
      if (exportStartDate) {
        payload.startDate = toStartOfDayIso(exportStartDate);
      }
      if (exportEndDate) {
        payload.endDate = toEndOfDayIso(exportEndDate);
      }

      // Add report-specific parameters
      if (exportReport === "trips") {
        payload.tripType = exportTripType;
        if (exportTripType === "CREDIT" && exportCompanyId) {
          payload.companyId = exportCompanyId;
        }
      } else if (exportReport === "expenses") {
        const cleanedTags = exportTags.split(",").map(t => t.trim()).filter(Boolean);
        if (cleanedTags.length > 0) {
          payload.tags = cleanedTags;
        }
      }

      const csvContent = await analysisService.exportData(payload);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const reportLabel = exportReport === "moneyTransfer" ? "money_transfers" : exportReport;
      const fileName = `${reportLabel}_export_${timestamp}`;
      
      await shareCSV(csvContent, fileName);
      Alert.alert("Success", "Report exported successfully!");
      setShowExportModal(false);
    } catch (err: any) {
      Alert.alert("Export Error", err.message || "Failed to export report CSV.");
    } finally {
      setExporting(false);
    }
  };

  const fetchAnalytics = useCallback(async () => {
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

    return {
      dashboard: dashboardData,
      profitSummary: profitData.summary,
    };
  }, [filters]);

  const { data: cachedData, isLoading, refetch } = useCachedFetch<{ dashboard: DashboardResponse; profitSummary: ProfitSummary | null } | null>(
    `ADMIN_ANALYTICS_${JSON.stringify(filters)}`,
    fetchAnalytics,
    null,
    { alwaysFetch: true }
  );

  const dashboard = cachedData?.dashboard;
  const profitSummary = cachedData?.profitSummary;

  if (isLoading || !dashboard) {
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => refetch(true)}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
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
            <Text className="text-white/60 text-sm mt-1">{`${user?.name || "Admin"}'s Fleet Overview`}</Text>
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
            Export Data
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm"
            onPress={() => {
              setExportStartDateStr("");
              setExportEndDateStr("");
              setExportStartDate(null);
              setExportEndDate(null);
              setExportSelectedDriverId("");
              setExportSelectedTruckId("");
              setExportCompanyId("");
              setExportTags("");
              setShowExportModal(true);
            }}
          >
            <View className="flex-row items-center p-5 gap-4">
              <View className="w-14 h-14 rounded-2xl items-center justify-center bg-success-50">
                <MaterialCommunityIcons name="file-export" size={28} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary font-bold text-lg">Export CSV Reports</Text>
                <Text className="text-text-secondary text-sm mt-0.5">Download trips, fuel, expenses or transfers</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

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

      {/* Export CSV Overlay (Absolute Overlay style to preserve navigation and React contexts) */}
      {showExportModal && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 justify-end z-[999]" style={{ elevation: 99 }}>
          <View className="bg-white rounded-t-[32px] max-h-[90%] border-t border-border" style={{ elevation: 20 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-border">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="file-export" size={22} color="#16A34A" />
                <Text className="text-text-primary font-bold text-lg">Export CSV Reports</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowExportModal(false)}
                disabled={exporting}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-6 py-4" contentContainerStyle={{ gap: 20, paddingBottom: 50 }}>
              
              {/* Report Type Selector */}
              <View className="gap-2">
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">
                  1. Report Type *
                </Text>
                <View className="flex-row flex-wrap gap-2.5">
                  {[
                    { id: "trips", label: "Trips", icon: "truck", color: "#2563EB", bg: "#EFF6FF" },
                    { id: "fuel", label: "Fuel Usage", icon: "gas-station", color: "#16A34A", bg: "#F0FDF4" },
                    { id: "refules", label: "Refuel Logs", icon: "gas-station-outline", color: "#F59E0B", bg: "#FFFBEB" },
                    { id: "expenses", label: "Expenses", icon: "receipt", color: "#DC2626", bg: "#FEF2F2" },
                    { id: "moneyTransfer", label: "Transfers", icon: "bank-transfer", color: "#7C3AED", bg: "#F5F3FF" }
                  ].map((item) => {
                    const isSelected = exportReport === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setExportReport(item.id as any);
                          // Reset report-specific state
                          setExportCompanyId("");
                          setExportTags("");
                        }}
                        className={`flex-row items-center px-4 py-3 rounded-xl border gap-2.5 ${
                          isSelected ? "bg-slate-900 border-slate-900" : "bg-white border-border"
                        }`}
                        style={{ width: "48%" }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons 
                          name={item.icon as any} 
                          size={18} 
                          color={isSelected ? "#fff" : item.color} 
                        />
                        <Text className={`text-sm font-semibold ${isSelected ? "text-white" : "text-text-primary"}`}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>



              {/* Date Filters */}
              <View className="gap-2">
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">
                  2. Date Range (Optional)
                </Text>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setShowExportFromPicker(true)}
                    className="flex-1 flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-border"
                  >
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text className="ml-2 text-sm text-text-primary flex-1" numberOfLines={1}>
                      {exportStartDate ? exportStartDate.toLocaleDateString() : "Start"}
                    </Text>
                  </TouchableOpacity>
                  <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                  <TouchableOpacity
                    onPress={() => setShowExportToPicker(true)}
                    className="flex-1 flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-border"
                  >
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text className="ml-2 text-sm text-text-primary flex-1" numberOfLines={1}>
                      {exportEndDate ? exportEndDate.toLocaleDateString() : "End"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Truck Selector */}
              <View className="gap-2">
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">
                  3. Filter by Truck (Optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1">
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setExportSelectedTruckId("")}
                      className={`px-4 py-2 rounded-full border ${
                        !exportSelectedTruckId ? "bg-slate-900 border-slate-900" : "bg-white border-border"
                      }`}
                    >
                      <Text className={`text-xs font-bold ${!exportSelectedTruckId ? "text-white" : "text-text-primary"}`}>
                        All Trucks
                      </Text>
                    </TouchableOpacity>
                    {exportTrucks.map(truck => (
                      <TouchableOpacity
                        key={truck.id}
                        onPress={() => setExportSelectedTruckId(truck.id)}
                        className={`px-4 py-2 rounded-full border ${
                          exportSelectedTruckId === truck.id ? "bg-slate-900 border-slate-900" : "bg-white border-border"
                        }`}
                      >
                        <Text className={`text-xs font-bold ${exportSelectedTruckId === truck.id ? "text-white" : "text-text-primary"}`}>
                          {truck.plateNumber}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Driver Selector */}
              <View className="gap-2">
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">
                  4. Filter by Driver (Optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1">
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setExportSelectedDriverId("")}
                      className={`px-4 py-2 rounded-full border ${
                        !exportSelectedDriverId ? "bg-slate-900 border-slate-900" : "bg-white border-border"
                      }`}
                    >
                      <Text className={`text-xs font-bold ${!exportSelectedDriverId ? "text-white" : "text-text-primary"}`}>
                        All Drivers
                      </Text>
                    </TouchableOpacity>
                    {exportDrivers.map(drv => (
                      <TouchableOpacity
                        key={drv.id}
                        onPress={() => setExportSelectedDriverId(drv.id)}
                        className={`px-4 py-2 rounded-full border ${
                          exportSelectedDriverId === drv.id ? "bg-slate-900 border-slate-900" : "bg-white border-border"
                        }`}
                      >
                        <Text className={`text-xs font-bold ${exportSelectedDriverId === drv.id ? "text-white" : "text-text-primary"}`}>
                          {drv.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* REPORT SPECIFIC: Trips Cash/Credit */}
              {exportReport === "trips" && (
                <View className="gap-4">
                  <View className="gap-2">
                    <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">
                      5. Trip Payment Type
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1">
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => {
                            console.log("[DEBUG] Clicked CASH. Current state:", exportTripType);
                            try {
                              setExportTripType("CASH");
                            } catch (e) {
                              console.log("[DEBUG] State update CASH failed", e);
                            }
                          }}
                          className={`px-4 py-2 rounded-full border ${
                            exportTripType === "CASH" ? "bg-slate-900 border-slate-900" : "bg-white border-border"
                          }`}
                        >
                          <Text className={`text-xs font-bold ${exportTripType === "CASH" ? "text-white" : "text-text-primary"}`}>
                            Cash Trips
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            console.log("[DEBUG] Clicked CREDIT. Current state:", exportTripType);
                            try {
                              setExportTripType("CREDIT");
                            } catch (e) {
                              console.log("[DEBUG] State update CREDIT failed", e);
                            }
                          }}
                          className={`px-4 py-2 rounded-full border ${
                            exportTripType === "CREDIT" ? "bg-slate-900 border-slate-900" : "bg-white border-border"
                          }`}
                        >
                          <Text className={`text-xs font-bold ${exportTripType === "CREDIT" ? "text-white" : "text-text-primary"}`}>
                            Credit Trips
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>

                  {/* Company Select for Credit Trips */}
                  {exportTripType === "CREDIT" && (
                    <View className="gap-2">
                      <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">
                        Credit Company Filter (Optional)
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1">
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => {
                              console.log("[DEBUG] Clearing Company Filter");
                              setExportCompanyId("");
                            }}
                            className={`px-4 py-2 rounded-full border ${
                              !exportCompanyId ? "bg-slate-900 border-slate-900" : "bg-white border-border"
                            }`}
                          >
                            <Text className={`text-xs font-bold ${!exportCompanyId ? "text-white" : "text-text-primary"}`}>
                              All Companies
                            </Text>
                          </TouchableOpacity>
                          {Array.isArray(exportCompanies) && exportCompanies.filter(Boolean).map(comp => {
                            if (!comp || !comp.id) return null;
                            return (
                              <TouchableOpacity
                                key={comp.id}
                                onPress={() => {
                                  console.log("[DEBUG] Selecting Company:", comp.id, comp.name);
                                  setExportCompanyId(comp.id);
                                }}
                                className={`px-4 py-2 rounded-full border ${
                                  exportCompanyId === comp.id ? "bg-slate-900 border-slate-900" : "bg-white border-border"
                                }`}
                              >
                                <Text className={`text-xs font-bold ${exportCompanyId === comp.id ? "text-white" : "text-text-primary"}`}>
                                  {comp.name || "Unnamed Company"}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* REPORT SPECIFIC: Expense Tags */}
              {exportReport === "expenses" && (
                <View className="gap-2 z-0">
                  <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">
                    5. Filter by Expense Tags (Optional)
                  </Text>
                  <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5">
                    <Ionicons name="pricetag-outline" size={16} color="#64748B" />
                    <TextInput
                      className="flex-1 text-sm text-text-primary ml-2.5 py-0"
                      placeholder="e.g. SALARY, FUEL, PERDIME (comma-separated)"
                      placeholderTextColor="#94A3B8"
                      value={exportTags}
                      onChangeText={setExportTags}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}

              {/* Submit Buttons */}
              <View className="flex-row gap-4 mt-6 z-0">
                <TouchableOpacity
                  onPress={() => setShowExportModal(false)}
                  disabled={exporting}
                  className="flex-1 py-4 bg-slate-100 rounded-xl items-center border border-slate-200"
                >
                  <Text className="text-text-secondary font-bold text-base">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTriggerExport}
                  disabled={exporting}
                  className="flex-1 py-4 bg-success rounded-xl items-center shadow-sm shadow-success-500 flex-row justify-center gap-2"
                >
                  {exporting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="download" size={18} color="#fff" />
                      <Text className="text-white font-bold text-base">Export CSV</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      )}
      {showExportFromPicker && (
        <DateTimePicker
          value={exportStartDate || fallbackDate}
          mode="date"
          display="default"
          onChange={(event, d) => {
            setShowExportFromPicker(false);
            if (event.type !== "dismissed" && d) {
              setExportStartDate(d);
            }
          }}
        />
      )}

      {showExportToPicker && (
        <DateTimePicker
          value={exportEndDate || fallbackDate}
          mode="date"
          display="default"
          onChange={(event, d) => {
            setShowExportToPicker(false);
            if (event.type !== "dismissed" && d) {
              setExportEndDate(d);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}
