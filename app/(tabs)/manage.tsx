import { router } from "expo-router";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/src/store";

const MANAGE_SECTIONS = [
  {
    id: "drivers",
    title: "Drivers",
    description: "Add, view and manage driver profiles",
    icon: "steering",
    iconLib: "material",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    stat: "2 Active",
  },
  {
    id: "trucks",
    title: "Trucks",
    description: "Track and manage your fleet of trucks",
    icon: "truck",
    iconLib: "material",
    color: "#0EA5E9",
    bgColor: "#F0F9FF",
    stat: "4 Trucks",
  },
] as const;

export default function ManageScreen() {
  const { user } = useAuthStore();
  const isManager = user?.role === "manager";

  if (!isManager) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8">
        <Ionicons name="lock-closed-outline" size={48} color="#94A3B8" />
        <Text className="text-text-primary font-bold text-xl mt-4 text-center">
          Managers Only
        </Text>
        <Text className="text-text-secondary text-sm mt-2 text-center">
          This section is restricted to manager accounts.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <Text className="text-text-primary font-bold text-2xl tracking-tight">
          Manage
        </Text>
        <Text className="text-text-secondary text-sm mt-0.5">
          Drivers & Trucks
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header */}
        <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase ml-1 mt-2">
          What would you like to manage?
        </Text>

        {/* Management Cards */}
        {MANAGE_SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.id}
            activeOpacity={0.85}
            className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm"
            onPress={() => {
              if (section.id === "drivers") {
                router.push("/drivers");
              }
            }}
          >
            <View className="flex-row items-center p-5 gap-4">
              {/* Icon */}
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{ backgroundColor: section.bgColor }}
              >
                <MaterialCommunityIcons
                  name={section.icon as any}
                  size={32}
                  color={section.color}
                />
              </View>

              {/* Text */}
              <View className="flex-1">
                <Text className="text-text-primary font-bold text-lg">
                  {section.title}
                </Text>
                <Text className="text-text-secondary text-sm mt-0.5" numberOfLines={2}>
                  {section.description}
                </Text>
                <View className="mt-2 self-start px-2.5 py-1 rounded-full bg-surface border border-border">
                  <Text className="text-text-secondary text-xs font-semibold">
                    {section.stat}
                  </Text>
                </View>
              </View>

              {/* Arrow */}
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Quick Insights Summary */}
        <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase ml-1 mt-4">
          Quick Overview
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <MaterialCommunityIcons name="account-group" size={28} color="#2563EB" />
            <Text className="text-text-primary font-bold text-2xl mt-2">2</Text>
            <Text className="text-text-secondary text-xs mt-0.5">Total Drivers</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <MaterialCommunityIcons name="truck-outline" size={28} color="#0EA5E9" />
            <Text className="text-text-primary font-bold text-2xl mt-2">4</Text>
            <Text className="text-text-secondary text-xs mt-0.5">Total Trucks</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
            <MaterialCommunityIcons name="road-variant" size={28} color="#16A34A" />
            <Text className="text-text-primary font-bold text-2xl mt-2">12</Text>
            <Text className="text-text-secondary text-xs mt-0.5">Total Trips</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
