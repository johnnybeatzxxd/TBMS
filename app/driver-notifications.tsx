import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { reminderService } from "@/src/api/services";
import { Reminder } from "@/src/types/reminder.types";

export default function DriverNotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Reminders" | "Notifications">("Reminders");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (activeTab === "Reminders") {
        const res = await reminderService.getPendingRemindersDriver();
        setReminders(res.pending || []);
      } else {
        const res = await reminderService.getNotificationsDriver();
        setNotifications(res.notifications || []);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(false);
    setRefreshing(false);
  }, [fetchData]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm" style={{ zIndex: 50 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
            <Ionicons name="arrow-back" size={20} color="#334155" />
          </TouchableOpacity>
          <Ionicons name="notifications" size={24} color="#2563EB" />
          <Text className="text-text-primary font-bold text-xl ml-2">Notifications Center</Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center border border-primary-100"
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size={16} color="#2563EB" />
          ) : (
            <Ionicons name="refresh" size={18} color="#2563EB" />
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.switchContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("Reminders")}
          style={[styles.switchTab, activeTab === "Reminders" && styles.switchTabActive]}
        >
          <Text style={[styles.switchText, activeTab === "Reminders" && { color: "#2563EB" }]}>
            🔔 Reminders
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("Notifications")}
          style={[styles.switchTab, activeTab === "Notifications" && styles.switchTabActive]}
        >
          <Text style={[styles.switchText, activeTab === "Notifications" && { color: "#2563EB" }]}>
            💬 Notifications
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : activeTab === "Reminders" ? (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item._id || item.id || ""}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563EB" />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center opacity-60">
              <Ionicons name="notifications-off-outline" size={64} color="#94A3B8" />
              <Text className="text-text-secondary text-base mt-4 text-center">
                You're all caught up!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white border border-border rounded-2xl p-4 mb-3 shadow-sm flex-row items-start">
              <View className="w-12 h-12 bg-rose-50 rounded-full items-center justify-center border border-rose-100 mr-3">
                <Ionicons name="alert-circle" size={24} color="#E11D48" />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary font-bold text-base mb-1">{item.reminderName}</Text>
                <Text className="text-text-secondary text-sm leading-5">{item.reminderMessage}</Text>
                <View className="mt-3 pt-3 border-t border-border-light flex-row justify-between items-center">
                  <Text className="text-primary-600 text-[10px] uppercase font-bold tracking-widest bg-primary-50 px-2 py-1 rounded-md">
                    {item.reminderType === "ONE_TIME" ? `Deadline: ${item.deadline ? item.deadline.split("T")[0] : "N/A"}` : `Frequency: ${item.frequency}`}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => item._id || item.id || `notif-${index}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563EB" />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center opacity-60">
              <Ionicons name="notifications-outline" size={64} color="#94A3B8" />
              <Text className="text-text-secondary text-base mt-4 text-center">
                No notifications logged yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white border border-border rounded-2xl p-4 mb-3 shadow-sm flex-row items-start">
              <View className="w-12 h-12 bg-primary-50 rounded-full items-center justify-center border border-primary-100 mr-3">
                <Ionicons name="notifications" size={24} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-text-primary font-bold text-base mb-1">
                  {item.title || item.notificationName || item.name || "Alert"}
                </Text>
                <Text className="text-text-secondary text-sm leading-5">
                  {item.message || item.notificationMessage || item.body || ""}
                </Text>
                {(item.createdAt || item.date) && (
                  <View className="mt-3 pt-3 border-t border-border-light flex-row justify-between items-center">
                    <Text className="text-text-secondary text-[10px] font-medium">
                      {new Date(item.createdAt || item.date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 4,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  switchTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  switchTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  switchText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#94A3B8",
  },
});
