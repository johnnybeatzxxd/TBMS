import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { DateFilterBar, DateFilterPreset } from "./DateFilterBar";
import { truckService } from "@/src/api/truck.service";
import { driverService } from "@/src/api/driver.service";
import { Driver } from "@/src/types/driver.types";

export type GroupByOption = "day" | "week" | "month" | "truck" | "driver";

export interface AnalysisFilterState {
  preset: DateFilterPreset;
  customFrom: Date | null;
  customTo: Date | null;
  /** Empty array = all trucks */
  truckIds: string[];
  driverId: string;
  groupBy: GroupByOption;
}

export const DEFAULT_ANALYSIS_FILTERS: AnalysisFilterState = {
  preset: "all",
  customFrom: null,
  customTo: null,
  truckIds: [],
  driverId: "all",
  groupBy: "day",
};

const GROUP_BY_LABELS: Record<GroupByOption, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  truck: "By Truck",
  driver: "By Driver",
};

interface AnalysisHeaderProps {
  title: string;
  icon: string;
  iconColor: string;
  showBack?: boolean;
  filters: AnalysisFilterState;
  onFiltersChange: (f: AnalysisFilterState) => void;
  /** Hide driver picker in the advanced filters modal */
  hideDriverFilter?: boolean;
  /** Hide group-by everywhere (modal + inline bar) */
  hideGroupBy?: boolean;
  /** Show group-by as pills under the date bar instead of in the modal */
  inlineGroupBy?: boolean;
  /** Hide the truck multi-select control */
  hideTruckFilter?: boolean;
  /** Hide the advanced-filters (options) button entirely */
  hideAdvancedFilters?: boolean;
  groupByOptions?: GroupByOption[];
  /** Used for the active-filter dot on the options button */
  defaultGroupBy?: GroupByOption;
}

export function AnalysisHeader({
  title,
  icon,
  iconColor,
  showBack = false,
  filters,
  onFiltersChange,
  hideDriverFilter = false,
  hideGroupBy = false,
  inlineGroupBy = false,
  hideTruckFilter = false,
  hideAdvancedFilters = false,
  groupByOptions = ["day", "week", "month", "truck", "driver"],
  defaultGroupBy = "day",
}: AnalysisHeaderProps) {
  const [fleetTrucks, setFleetTrucks] = useState<{ id: string; plateNumber: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [showTruckMenu, setShowTruckMenu] = useState(false);
  const [draftTruckIds, setDraftTruckIds] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await truckService.getMyTrucks();
        if ("trucks" in res) {
          setFleetTrucks(res.trucks);
        }
      } catch (e) {
        console.error("Failed to load trucks:", e);
        setFleetTrucks([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (hideDriverFilter) return;
    (async () => {
      try {
        const res = await driverService.getMyDrivers();
        if ("drivers" in res) {
          setDrivers([
            { id: "all", name: "All Drivers" },
            ...res.drivers.map((d: Driver) => ({ id: d.id, name: d.name })),
          ]);
        }
      } catch (e) {
        console.error("Failed to load drivers:", e);
        setDrivers([{ id: "all", name: "All Drivers" }]);
      }
    })();
  }, [hideDriverFilter]);

  const update = (partial: Partial<AnalysisFilterState>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  const truckById = useMemo(
    () => Object.fromEntries(fleetTrucks.map((t) => [t.id, t.plateNumber])),
    [fleetTrucks]
  );

  const selectedTruckLabel = useMemo(() => {
    const { truckIds } = filters;
    if (truckIds.length === 0) return "All Trucks";
    if (truckIds.length === 1) return truckById[truckIds[0]] || "1 Truck";
    return `${truckIds.length} Trucks`;
  }, [filters.truckIds, truckById]);

  const isDraftAllTrucks = draftTruckIds.length === 0;

  const openTruckMenu = () => {
    setDraftTruckIds([...filters.truckIds]);
    setShowTruckMenu(true);
  };

  const closeTruckMenu = () => setShowTruckMenu(false);

  const applyTruckSelection = () => {
    update({ truckIds: [...draftTruckIds] });
    closeTruckMenu();
  };

  const toggleDraftTruck = (truckId: string) => {
    const selected = new Set(draftTruckIds);
    if (selected.has(truckId)) {
      selected.delete(truckId);
    } else {
      selected.add(truckId);
    }
    setDraftTruckIds(Array.from(selected));
  };

  const removeTruckChip = (truckId: string) => {
    update({ truckIds: filters.truckIds.filter((id) => id !== truckId) });
  };

  const showGroupByInModal = !hideGroupBy && !inlineGroupBy;
  const showAdvancedFiltersButton =
    !hideAdvancedFilters && (!hideDriverFilter || showGroupByInModal);
  const showInlineGroupBy = !hideGroupBy && inlineGroupBy && groupByOptions.length > 0;

  const hasActiveFilters =
    filters.driverId !== "all" ||
    (showGroupByInModal && filters.groupBy !== defaultGroupBy);

  return (
    <View className="z-[99] relative">
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 bg-white border-b border-border shadow-sm z-50 elevation-10">
        <View className="flex-row items-center flex-1 pr-2">
          {showBack && (
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-9 h-9 bg-surface rounded-xl items-center justify-center mr-3 border border-border"
            >
              <Ionicons name="arrow-back" size={20} color="#334155" />
            </TouchableOpacity>
          )}
          <MaterialCommunityIcons name={icon as any} size={26} color={iconColor} />
          <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide" numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {!hideTruckFilter && (
          <View className="relative z-50">
            <TouchableOpacity
              onPress={() => (showTruckMenu ? closeTruckMenu() : openTruckMenu())}
              className="flex-row items-center gap-1.5 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2"
              activeOpacity={0.8}
            >
              <Ionicons name="car-sport" size={14} color="#2563EB" />
              <Text className="text-primary font-semibold text-xs max-w-[88px]" numberOfLines={1}>
                {selectedTruckLabel}
              </Text>
              <Ionicons name={showTruckMenu ? "chevron-up" : "chevron-down"} size={14} color="#2563EB" />
            </TouchableOpacity>

            {showTruckMenu && (
              <View className="absolute right-0 top-10 bg-white rounded-2xl border border-border shadow-lg overflow-hidden min-w-[200px] z-[999] elevation-20">
                <TouchableOpacity
                  onPress={() => setDraftTruckIds([])}
                  className={`px-4 py-3 flex-row items-center gap-2 border-b border-border/50 ${
                    isDraftAllTrucks ? "bg-primary-50" : "bg-white"
                  }`}
                >
                  <Ionicons
                    name={isDraftAllTrucks ? "checkbox" : "square-outline"}
                    size={18}
                    color={isDraftAllTrucks ? "#2563EB" : "#64748B"}
                  />
                  <Text
                    className={`text-sm flex-1 ${
                      isDraftAllTrucks ? "text-primary font-bold" : "text-text-primary font-medium"
                    }`}
                  >
                    All Trucks
                  </Text>
                </TouchableOpacity>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                  {fleetTrucks.map((truck) => {
                    const checked = draftTruckIds.includes(truck.id);
                    return (
                      <TouchableOpacity
                        key={truck.id}
                        onPress={() => toggleDraftTruck(truck.id)}
                        className={`px-4 py-3 flex-row items-center gap-2 ${
                          checked ? "bg-primary-50" : "bg-white"
                        }`}
                      >
                        <Ionicons
                          name={checked ? "checkbox" : "square-outline"}
                          size={18}
                          color={checked ? "#2563EB" : "#64748B"}
                        />
                        <Text
                          className={`text-sm flex-1 ${
                            checked ? "text-primary font-bold" : "text-text-primary font-medium"
                          }`}
                        >
                          {truck.plateNumber}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  onPress={applyTruckSelection}
                  className="px-4 py-2.5 bg-primary border-t border-primary items-center"
                >
                  <Text className="text-white font-semibold text-sm">Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          )}

          {showAdvancedFiltersButton && (
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              className="w-9 h-9 bg-surface border border-border rounded-xl items-center justify-center relative"
            >
              <Ionicons name="options" size={18} color="#64748B" />
              {hasActiveFilters && (
                <View className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="bg-white border-b border-border shadow-sm z-40 relative elevation-5">
        <DateFilterBar
          activePreset={filters.preset}
          onPresetChange={(preset) => update({ preset })}
          customFrom={filters.customFrom}
          customTo={filters.customTo}
          onCustomFromChange={(d) => update({ preset: "custom", customFrom: d })}
          onCustomToChange={(d) => update({ preset: "custom", customTo: d })}
        />
        {showInlineGroupBy && (
          <View className="px-4 pb-3">
            <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-2 ml-0.5">
              Group by
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {groupByOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => update({ groupBy: opt })}
                    className={`px-3 py-1.5 rounded-full border ${
                      filters.groupBy === opt ? "bg-primary border-primary" : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        filters.groupBy === opt ? "text-white" : "text-text-secondary"
                      }`}
                    >
                      {GROUP_BY_LABELS[opt]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
        {!hideTruckFilter && filters.truckIds.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
            className="flex-row"
          >
            {filters.truckIds.map((id) => (
              <View
                key={id}
                className="flex-row items-center bg-primary-50 border border-primary-100 rounded-full pl-3 pr-1 py-1"
              >
                <Text className="text-primary font-semibold text-xs mr-1">
                  {truckById[id] || "Truck"}
                </Text>
                <TouchableOpacity
                  onPress={() => removeTruckChip(id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="w-6 h-6 rounded-full items-center justify-center"
                >
                  <Ionicons name="close-circle" size={18} color="#2563EB" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => update({ truckIds: [] })}
              className="px-3 py-1.5 rounded-full border border-border bg-surface"
            >
              <Text className="text-text-secondary text-xs font-semibold">Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      <Modal visible={showFilterModal} transparent animationType="fade">
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="absolute inset-0 bg-black/50"
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View className="bg-white rounded-t-3xl p-5 shadow-lg max-h-[80%]">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-bold text-text-primary">Advanced Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} className="p-1">
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!hideDriverFilter && (
                <View className="mb-6">
                  <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">
                    Select Driver
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {drivers.map((driver) => (
                      <TouchableOpacity
                        key={driver.id}
                        onPress={() => update({ driverId: driver.id })}
                        className={`px-4 py-2.5 rounded-xl border ${
                          filters.driverId === driver.id ? "bg-purple-50 border-purple-200" : "bg-surface border-border"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            filters.driverId === driver.id ? "text-purple-700" : "text-text-primary"
                          }`}
                        >
                          {driver.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {showGroupByInModal && (
                <View className="mb-6">
                  <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-1">
                    Group Data By
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {groupByOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => update({ groupBy: opt })}
                        className={`px-4 py-2.5 rounded-xl border ${
                          filters.groupBy === opt ? "bg-primary border-primary" : "bg-surface border-border"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            filters.groupBy === opt ? "text-white" : "text-text-secondary"
                          }`}
                        >
                          {GROUP_BY_LABELS[opt]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              className="bg-primary rounded-xl py-3.5 items-center mt-2"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
