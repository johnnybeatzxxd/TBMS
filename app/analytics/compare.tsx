import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { analysisService } from "@/src/api/analysis.service";
import { truckService } from "@/src/api/truck.service";
import { driverService } from "@/src/api/driver.service";
import { buildPayloadFromFilters, getInitialFiltersFromParams } from "@/src/utils/analysisFilters";
import { CompareEntity, CompareMetrics } from "@/src/types/analysis.types";
import { AnalysisHeader, AnalysisFilterState, GroupByOption } from "@/src/components/AnalysisHeader";
import { formatAnalysisPeriodLabel } from "@/src/utils/analysisChartLabels";
import { Driver } from "@/src/types/driver.types";

const fmt = (n?: number | null) => (n ?? 0).toLocaleString("en-US");

const COMPARE_GROUP_OPTIONS: GroupByOption[] = ["day", "week", "month"];

function SummaryGrid({ metrics, accent }: { metrics: CompareMetrics; accent: string }) {
  return (
    <View className="flex-row flex-wrap gap-2 mt-3">
      <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
        <Text className="text-text-secondary text-xs">Revenue</Text>
        <Text className="font-bold text-sm" style={{ color: accent }}>${fmt(metrics.revenue)}</Text>
      </View>
      <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
        <Text className="text-text-secondary text-xs">Profit</Text>
        <Text className={`font-bold text-sm ${metrics.profit >= 0 ? "text-success-600" : "text-danger-600"}`}>
          ${fmt(metrics.profit)}
        </Text>
      </View>
      <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
        <Text className="text-text-secondary text-xs">Trips</Text>
        <Text className="text-text-primary font-bold text-sm">{fmt(metrics.trip_count)}</Text>
      </View>
      <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
        <Text className="text-text-secondary text-xs">Expense</Text>
        <Text className="text-text-primary font-bold text-sm">${fmt(metrics.expense)}</Text>
      </View>
      <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
        <Text className="text-text-secondary text-xs">Fuel</Text>
        <Text className="text-text-primary font-bold text-sm">{fmt(metrics.fuel_usage)}L</Text>
      </View>
      <View className="flex-1 min-w-[45%] bg-surface rounded-xl px-3 py-2">
        <Text className="text-text-secondary text-xs">Fuel / Trip</Text>
        <Text className="text-text-primary font-bold text-sm">{fmt(Math.round(metrics.fuel_usage_per_trip))}L</Text>
      </View>
    </View>
  );
}

export default function CompareAnalysisScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<CompareEntity[]>([]);
  const [entityType, setEntityType] = useState<"truck" | "driver">("truck");
  const [entities, setEntities] = useState<{ id: string; label: string }[]>([]);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<AnalysisFilterState>(() => {
    const initial = getInitialFiltersFromParams(params, "week");
    return { ...initial, groupBy: COMPARE_GROUP_OPTIONS.includes(initial.groupBy as GroupByOption) ? initial.groupBy : "week" };
  });

  useEffect(() => {
    (async () => {
      try {
        if (entityType === "truck") {
          const res = await truckService.getMyTrucks();
          if ("trucks" in res) {
            setEntities(res.trucks.map((t) => ({ id: t.id, label: t.plateNumber })));
          }
        } else {
          const res = await driverService.getMyDrivers();
          if ("drivers" in res) {
            setEntities(res.drivers.map((d: Driver) => ({ id: d.id, label: d.name })));
          }
        }
      } catch (e) {
        console.error("Failed to load entities:", e);
        setEntities([]);
      }
    })();
  }, [entityType]);

  useEffect(() => {
    setSelectedEntityIds([]);
  }, [entityType]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const base = buildPayloadFromFilters(filters);
        const groupBy =
          filters.groupBy === "day" || filters.groupBy === "week" || filters.groupBy === "month"
            ? filters.groupBy
            : "week";

        const result = await analysisService.getCompare({
          entityType,
          entityIds: selectedEntityIds.length >= 2 ? selectedEntityIds : undefined,
          groupBy,
          startDate: base.startDate,
          endDate: base.endDate,
          truckIds: base.truckIds,
        });

        setComparison(result.comparison || []);
      } catch (e) {
        console.error("Failed to load comparison:", e);
        setComparison([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters, entityType, selectedEntityIds]);

  const entityColors = useMemo(() => ["#2563EB", "#7C3AED", "#16A34A", "#F59E0B"], []);

  const toggleEntity = (id: string) => {
    setSelectedEntityIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      <AnalysisHeader
        title="Compare"
        icon="compare-horizontal"
        iconColor="#0EA5E9"
        showBack
        filters={filters}
        onFiltersChange={setFilters}
        hideDriverFilter
        hideTruckFilter
        hideAdvancedFilters
        inlineGroupBy
        groupByOptions={COMPARE_GROUP_OPTIONS}
        defaultGroupBy="week"
      />

      <View className="flex-row mx-4 mt-3 mb-1 bg-white rounded-xl border border-border overflow-hidden">
        <TouchableOpacity
          onPress={() => setEntityType("truck")}
          className={`flex-1 py-3 items-center ${entityType === "truck" ? "bg-primary" : "bg-white"}`}
        >
          <Text className={`font-semibold text-sm ${entityType === "truck" ? "text-white" : "text-text-secondary"}`}>
            Trucks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setEntityType("driver")}
          className={`flex-1 py-3 items-center ${entityType === "driver" ? "bg-primary" : "bg-white"}`}
        >
          <Text className={`font-semibold text-sm ${entityType === "driver" ? "text-white" : "text-text-secondary"}`}>
            Drivers
          </Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 py-3">
        <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
          Compare {entityType === "truck" ? "Trucks" : "Drivers"} (optional, min 2)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {entities.map((e) => {
            const selected = selectedEntityIds.includes(e.id);
            return (
              <TouchableOpacity
                key={e.id}
                onPress={() => toggleEntity(e.id)}
                className={`px-4 py-2 rounded-full border ${
                  selected ? "bg-sky-50 border-sky-300" : "bg-white border-border"
                }`}
              >
                <Text className={`text-sm font-semibold ${selected ? "text-sky-700" : "text-text-primary"}`}>
                  {e.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {selectedEntityIds.length > 0 && selectedEntityIds.length < 2 && (
          <Text className="text-amber-600 text-xs mt-2 ml-1">
            Pick at least 2, or leave empty to compare the first two by default.
          </Text>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {comparison.length === 0 && (
            <View className="bg-white rounded-2xl border border-border p-8 items-center shadow-sm">
              <MaterialCommunityIcons name="compare" size={48} color="#CBD5E1" />
              <Text className="text-text-secondary text-sm mt-3 text-center">No comparison data for this period</Text>
            </View>
          )}

          {comparison.map((entity, i) => {
            const color = entityColors[i % entityColors.length];
            return (
              <View key={entity.name} className="bg-white rounded-2xl border border-border p-4 shadow-sm mb-4">
                <View className="flex-row items-center gap-3 mb-1">
                  <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <MaterialCommunityIcons name={entityType === "truck" ? "truck" : "account"} size={22} color={color} />
                  </View>
                  <Text className="text-text-primary font-bold text-lg flex-1">{entity.name}</Text>
                </View>

                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase ml-1 mt-2">Summary</Text>
                <SummaryGrid metrics={entity.summary} accent={color} />

                {(entity.breakdown || []).length > 0 && (
                  <View className="mt-4 pt-3 border-t border-border/50">
                    <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                      Over Time
                    </Text>
                    {(entity.breakdown || []).map((row) => (
                      <View key={row.key} className="py-3 border-b border-border/40">
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center gap-2">
                            <Ionicons name="calendar-outline" size={14} color="#64748B" />
                            <Text className="text-text-primary text-sm font-medium">
                              {formatAnalysisPeriodLabel(row.key, filters.groupBy)}
                            </Text>
                          </View>
                          <Text className={`font-bold text-sm ${row.metrics.profit >= 0 ? "text-success-600" : "text-danger-600"}`}>
                            ${fmt(row.metrics.profit)}
                          </Text>
                        </View>
                        <Text className="text-text-secondary text-xs">
                          Rev ${fmt(row.metrics.revenue)} · {fmt(row.metrics.trip_count)} trips · Exp ${fmt(row.metrics.expense)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
