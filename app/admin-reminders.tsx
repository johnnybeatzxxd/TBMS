import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { reminderService, driverService } from "@/src/api/services";
import { Reminder } from "@/src/types/reminder.types";
import { useActionStore } from "@/src/store";

const ReminderCard = ({ item, onDelete, driverMap }: { item: Reminder, onDelete: (id: string) => void, driverMap: Record<string, string> }) => {
  const [expanded, setExpanded] = useState(false);
  const { isActionPending } = useActionStore();
  const isOneTime = item.reminderType === "ONE_TIME";
  const isDeleting = isActionPending(`delete_reminder_${item._id || item.id}`);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className="bg-white p-4 rounded-2xl mb-3 border border-border flex-row items-center justify-between shadow-sm"
    >
      <View className="flex-1 pr-3">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 border ${
            item.reminderActive ? "bg-success-50 border-success-100" : "bg-slate-50 border-slate-200"
          }`}>
            <Ionicons name={isOneTime ? "calendar-outline" : "repeat-outline"} size={18} color={item.reminderActive ? "#16A34A" : "#64748B"} />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
              {item.reminderName}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className={`px-2 py-0.5 rounded mr-2 ${isOneTime ? "bg-primary-50" : "bg-purple-50"}`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${isOneTime ? "text-primary-700" : "text-purple-700"}`}>
                  {isOneTime ? "One Time" : item.frequency}
                </Text>
              </View>
              {!item.reminderActive && (
                <View className="px-2 py-0.5 rounded bg-slate-100">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Inactive
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {expanded && (
          <View className="mt-4 pt-4 border-t border-border/50">
            <Text className="text-text-secondary text-sm leading-5 mb-4">
              "{item.reminderMessage}"
            </Text>
            <View className="bg-surface rounded-xl p-3 border border-border/50 mb-3 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Start Date</Text>
                <Text className="text-text-primary text-sm font-medium">{item.reminderStart.split("T")[0]}</Text>
              </View>
              {isOneTime && item.deadline && (
                <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
                  <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Deadline</Text>
                  <Text className="text-text-primary text-sm font-medium">{item.deadline.split("T")[0]}</Text>
                </View>
              )}
              {item.remindDrivers && item.remindDrivers.length > 0 && (
                <View className="flex-col pt-2 border-t border-border/30 gap-1 mt-1">
                  <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Target Drivers</Text>
                  <Text className="text-text-primary text-[13px] leading-5">
                    {item.remindDrivers.map(id => driverMap[id] || id).join(", ")}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
              className={`px-4 py-2 rounded-lg items-center ${isDeleting ? "bg-danger-100 border-danger-300" : "bg-danger-50 border border-danger-200"}`}
              activeOpacity={0.8}
              disabled={isDeleting}
              onPress={(e) => { e.stopPropagation(); onDelete(item._id || item.id || ""); }}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text className="text-danger-600 font-semibold text-xs">Delete Reminder</Text>
              )}
            </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" />
    </TouchableOpacity>
  );
};

export default function AdminRemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverMap, setDriverMap] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const [remRes, drvRes] = await Promise.all([
        reminderService.getReminders(),
        driverService.getMyDrivers().catch(() => ({ drivers: [] }))
      ]);
      setReminders(remRes.reminders || []);
      
      const map: Record<string, string> = {};
      drvRes.drivers.forEach((d: any) => { map[d.id || d._id] = d.name; });
      setDriverMap(map);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const { startAction, stopAction } = useActionStore();

  const handleDelete = (id: string) => {
    Alert.alert("Delete Reminder", "Are you sure you want to completely delete this routine?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        startAction(`delete_reminder_${id}`);
        try {
          await reminderService.deleteReminder(id);
          setReminders(prev => prev.filter(r => (r._id || r.id) !== id));
        } catch (e: any) {
          Alert.alert("Error", e.message || "Failed to delete");
        } finally {
          stopAction(`delete_reminder_${id}`);
        }
      }}
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Ionicons name="notifications-outline" size={26} color="#2563EB" />
        <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide">
          Manage Reminders
        </Text>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item, idx) => (item._id || item.id || idx).toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        ListEmptyComponent={
          !loading ? (
            <View className="py-20 items-center justify-center opacity-60">
              <Ionicons name="notifications-off-outline" size={64} color="#94A3B8" />
              <Text className="text-text-secondary text-base mt-4 text-center">
                No active routines found.
              </Text>
            </View>
          ) : (
            <View className="py-20 items-center justify-center gap-3">
               <ActivityIndicator size="large" color="#2563EB" />
            </View>
          )
        }
        renderItem={({ item }) => <ReminderCard item={item} onDelete={handleDelete} driverMap={driverMap} />}
      />

      <TouchableOpacity
        onPress={() => router.push("/add-reminder")}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg border border-primary-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
