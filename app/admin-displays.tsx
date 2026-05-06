import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList, RefreshControl, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { displayService, driverService } from "@/src/api/services";
import { RollingDisplay } from "@/src/types/display.types";

const DisplayCard = ({ item, onDelete, onToggle, driverMap }: { item: RollingDisplay, onDelete: (id: string) => void, onToggle: (id: string) => void, driverMap: Record<string, string> }) => {
  const [expanded, setExpanded] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    await onToggle(item._id || item.id || "");
    setIsToggling(false);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className="bg-white p-4 rounded-2xl mb-3 border border-border flex-col shadow-sm"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3 flex-row items-center">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 border ${
            item.displayActive ? "bg-primary-50 border-primary-200" : "bg-slate-50 border-slate-200"
          }`}>
            <Ionicons name="megaphone-outline" size={18} color={item.displayActive ? "#2563EB" : "#64748B"} />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base leading-5" numberOfLines={2}>
              "{item.displayMessage}"
            </Text>
            <Text className="text-xs text-text-secondary mt-1 font-medium tracking-wide">
              {item.forDrivers && item.forDrivers.length > 0 ? `${item.forDrivers.length} Selected Drivers` : "All Drivers"}
            </Text>
          </View>
        </View>
        
        <Switch
          value={item.displayActive}
          onValueChange={handleToggle}
          disabled={isToggling}
          trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
          thumbColor={item.displayActive ? "#2563EB" : "#F8FAFC"}
        />
      </View>

      {expanded && (
        <View className="mt-4 pt-4 border-t border-border/50">
          <View className="bg-surface rounded-xl p-3 border border-border/50 mb-3 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Start Time</Text>
              <Text className="text-text-primary text-sm font-medium">{new Date(item.startTime).toISOString().split("T")[0]}</Text>
            </View>
            <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
              <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">End Time</Text>
              <Text className="text-text-primary text-sm font-medium">{new Date(item.endTime).toISOString().split("T")[0]}</Text>
            </View>
            {item.forDrivers && item.forDrivers.length > 0 && (
              <View className="flex-col pt-2 border-t border-border/30 gap-1 mt-1">
                <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">Target Drivers</Text>
                <Text className="text-text-primary text-[13px] leading-5">
                  {item.forDrivers.map(id => driverMap[id] || id).join(", ")}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row justify-end mt-2">
            <TouchableOpacity
              className="px-4 py-2 bg-danger-50 border border-danger-200 rounded-lg items-center"
              activeOpacity={0.8}
              onPress={(e) => { e.stopPropagation(); onDelete(item._id || item.id || ""); }}
            >
              <Text className="text-danger-600 font-semibold text-xs">Delete Banner</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function AdminDisplaysScreen() {
  const [displays, setDisplays] = useState<RollingDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverMap, setDriverMap] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const [dispRes, drvRes] = await Promise.all([
        displayService.getRollingDisplays(),
        driverService.getMyDrivers().catch(() => ({ drivers: [] }))
      ]);
      setDisplays(dispRes.displays || []);
      
      const map: Record<string, string> = {};
      drvRes.drivers.forEach((d: any) => { map[d.id || d._id] = d.name; });
      setDriverMap(map);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load displays");
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

  const handleToggle = async (id: string) => {
    try {
      await displayService.toggleDisplay(id);
      setDisplays(prev => prev.map(d => (d._id || d.id) === id ? { ...d, displayActive: !d.displayActive } : d));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to toggle");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Banner", "Are you sure you want to permanently delete this display message?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await displayService.deleteDisplay(id);
          setDisplays(prev => prev.filter(d => (d._id || d.id) !== id));
        } catch (e: any) {
          Alert.alert("Error", e.message || "Failed to delete");
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
        <Ionicons name="chatbubbles-outline" size={26} color="#2563EB" />
        <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide">
          Fleet Billboard
        </Text>
      </View>

      <FlatList
        data={displays}
        keyExtractor={(item, idx) => (item._id || item.id || idx).toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        ListEmptyComponent={
          !loading ? (
            <View className="py-20 items-center justify-center opacity-60">
              <Ionicons name="chatbox-ellipses-outline" size={64} color="#94A3B8" />
              <Text className="text-text-secondary text-base mt-4 text-center max-w-[200px]">
                No active announcements circulating currently.
              </Text>
            </View>
          ) : (
            <View className="py-20 items-center justify-center gap-3">
               <ActivityIndicator size="large" color="#2563EB" />
            </View>
          )
        }
        renderItem={({ item }) => <DisplayCard item={item} onDelete={handleDelete} onToggle={handleToggle} driverMap={driverMap} />}
      />

      <TouchableOpacity
        onPress={() => router.push("/add-display")}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg border border-primary-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
