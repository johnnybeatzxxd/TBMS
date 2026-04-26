import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { mockTransferService } from "@/src/api/mock/transfers.mock";
import { Transfer } from "@/src/types";
import { DateFilterBar, DateFilterPreset, passesDateFilter } from "@/src/components/DateFilterBar";

const getRelativeDateLabel = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return dateStr;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const TransferCard = ({ tx }: { tx: Transfer }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className="bg-white p-4 rounded-2xl mb-3 border border-border shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          <View 
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 border ${
              tx.type === "increment" ? "bg-success-50 border-success-100" : "bg-danger-50 border-danger-100"
            }`}
          >
            <Ionicons 
              name={tx.type === "increment" ? "arrow-up" : "arrow-down"} 
              size={18} 
              color={tx.type === "increment" ? "#16A34A" : "#DC2626"} 
            />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
              Transfer
            </Text>
            <Text className="text-text-secondary text-xs mt-0.5" numberOfLines={1}>
              Driver Details: {tx.driverId}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text 
            className={`font-bold text-lg ${
              tx.type === "increment" ? "text-success-600" : "text-danger-600"
            }`}
          >
            {tx.type === "increment" ? "+" : "-"} ${tx.amount.toFixed(2)}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#94A3B8"
            style={{ marginTop: 2 }}
          />
        </View>
      </View>

      {/* EXPANDED CONTENT: Full Remark */}
      {expanded && (
        <View className="mt-3 pt-3 border-t border-border/50">
          <View className="bg-surface rounded-xl p-3 border border-border/50">
            <Text className="text-text-secondary text-sm leading-5">
              {tx.remark}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function TransfersScreen() {
  const { user } = useAuthStore();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await mockTransferService.getTransfers();
      setTransfers(res.transfers);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const filteredTransfers = useMemo(() =>
    transfers.filter(tx => passesDateFilter(tx.date, filterPreset, customFrom, customTo)),
    [transfers, filterPreset, customFrom, customTo]
  );

  const groupedTransfers = filteredTransfers.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, typeof transfers>);

  const transferGroups = Object.entries(groupedTransfers).map(([date, txs]) => ({
    dateStr: date,
    title: getRelativeDateLabel(date),
    data: txs,
  }));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <View className="flex-row items-center">
          <Ionicons name="swap-horizontal" size={26} color="#2563EB" />
          <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide">
            Transfers
          </Text>
        </View>
      </View>

      {/* Date Filter */}
      <DateFilterBar
        activePreset={filterPreset}
        onPresetChange={setFilterPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {transferGroups.length === 0 ? (
            <View className="items-center justify-center py-20 opacity-60">
              <Ionicons name="card-outline" size={64} color="#94A3B8" />
              <Text className="text-text-secondary text-base mt-4 text-center">
                No money transfers found.
              </Text>
            </View>
          ) : (
            transferGroups.map((group) => (
              <View key={group.dateStr} className="mb-6">
                <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-2">
                  {group.title}
                </Text>
                {group.data.map((tx) => (
                  <TransferCard key={tx.id} tx={tx} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB - Add Transfer - Available for all roles */}
      <TouchableOpacity
        onPress={() => router.push("/add-transfer")}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg border border-primary-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
