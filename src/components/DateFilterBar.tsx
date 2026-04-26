import { useState } from "react";
import { View, Text, TouchableOpacity, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

export type DateFilterPreset = "all" | "today" | "week" | "month" | "custom";

interface DateFilterBarProps {
  activePreset: DateFilterPreset;
  onPresetChange: (preset: DateFilterPreset) => void;
  customFrom: Date | null;
  customTo: Date | null;
  onCustomFromChange: (date: Date) => void;
  onCustomToChange: (date: Date) => void;
  hideCustomDateRow?: boolean;
}

const PRESETS: { key: DateFilterPreset; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

const formatShort = (d: Date) => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
};

export function DateFilterBar({
  activePreset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  hideCustomDateRow = false,
}: DateFilterBarProps) {
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  return (
    <View className="bg-white py-3 border-b border-border/50">
      {/* Preset Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View className="flex-row gap-2">
          {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => onPresetChange(p.key)}
            className={`px-3 py-1.5 rounded-full border ${
              activePreset === p.key
                ? "bg-primary border-primary"
                : "bg-surface border-border"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activePreset === p.key ? "text-white" : "text-text-secondary"
              }`}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
        </View>
      </ScrollView>

      {/* Custom Date Range Row */}
      {activePreset === "custom" && !hideCustomDateRow && (
        <View className="flex-row items-center gap-2 mt-3 px-4">
          <TouchableOpacity
            onPress={() => setShowFromPicker(true)}
            className="flex-1 flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border"
          >
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text className="ml-2 text-sm text-text-primary">
              {customFrom ? formatShort(customFrom) : "From"}
            </Text>
          </TouchableOpacity>

          <Ionicons name="arrow-forward" size={14} color="#94A3B8" />

          <TouchableOpacity
            onPress={() => setShowToPicker(true)}
            className="flex-1 flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border"
          >
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text className="ml-2 text-sm text-text-primary">
              {customTo ? formatShort(customTo) : "To"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showFromPicker && (
        <DateTimePicker
          value={customFrom || new Date()}
          mode="date"
          display="default"
          onChange={(_, d) => {
            if (Platform.OS === "android") setShowFromPicker(false);
            if (d) onCustomFromChange(d);
          }}
        />
      )}
      {Platform.OS === "ios" && showFromPicker && (
        <TouchableOpacity
          onPress={() => setShowFromPicker(false)}
          className="mt-2 py-1.5 items-center bg-slate-100 rounded-lg"
        >
          <Text className="text-primary font-semibold text-sm">Done</Text>
        </TouchableOpacity>
      )}

      {showToPicker && (
        <DateTimePicker
          value={customTo || new Date()}
          mode="date"
          display="default"
          onChange={(_, d) => {
            if (Platform.OS === "android") setShowToPicker(false);
            if (d) onCustomToChange(d);
          }}
        />
      )}
      {Platform.OS === "ios" && showToPicker && (
        <TouchableOpacity
          onPress={() => setShowToPicker(false)}
          className="mt-2 py-1.5 items-center bg-slate-100 rounded-lg"
        >
          <Text className="text-primary font-semibold text-sm">Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Shared helper: return true if a YYYY-MM-DD dateStr passes the current filter.
 */
export function passesDateFilter(
  dateStr: string,
  preset: DateFilterPreset,
  customFrom: Date | null,
  customTo: Date | null
): boolean {
  if (preset === "all") return true;

  const parts = dateStr.includes("-")
    ? dateStr.split("-").map(Number)
    : dateStr.split("/").map(Number);

  let d: Date;
  if (dateStr.includes("-")) {
    d = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    // MM/DD/YYYY format
    d = new Date(parts[2], parts[0] - 1, parts[1]);
  }
  if (isNaN(d.getTime())) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (preset === "today") {
    return d.toDateString() === today.toDateString();
  }

  if (preset === "week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }

  if (preset === "month") {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return d >= monthAgo;
  }

  if (preset === "custom") {
    if (customFrom) {
      const from = new Date(customFrom);
      from.setHours(0, 0, 0, 0);
      if (d < from) return false;
    }
    if (customTo) {
      const to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }
    return true;
  }

  return true;
}
