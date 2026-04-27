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
  {
    id: "requests",
    title: "Service Requests",
    description: "Manage maintenance and driver requests",
    icon: "clipboard-list",
    iconLib: "material",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    stat: "3 Pending",
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Background + Avatar */}
        <View className="bg-primary pt-6 pb-20 px-5 rounded-b-[40px]">
          <Text className="text-white/70 text-xs font-semibold tracking-widest uppercase text-center mb-4">
            Manager Console
          </Text>

          {/* Avatar */}
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 items-center justify-center mb-3">
              <Text className="text-white text-3xl font-bold uppercase">
                {user?.name ? user.name.charAt(0) : "M"}
              </Text>
            </View>

            {/* Name */}
            <Text className="text-white text-2xl font-bold tracking-wide">
              {user?.name || "Manager"}
            </Text>

            {/* Role Badge */}
            <View className="mt-2 px-4 py-1.5 rounded-full flex-row items-center gap-1.5 bg-white/20">
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text className="text-xs font-bold tracking-wider uppercase text-white">
                {user?.role || "Admin"}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content — overlapping cards */}
        <View className="px-5 -mt-10 gap-5">
          {/* Quick Insights Summary */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <MaterialCommunityIcons name="account-group" size={28} color="#2563EB" />
              <Text className="text-text-primary font-bold text-2xl mt-2">2</Text>
              <Text className="text-text-secondary text-xs mt-0.5">Active Drivers</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <MaterialCommunityIcons name="truck-outline" size={28} color="#0EA5E9" />
              <Text className="text-text-primary font-bold text-2xl mt-2">4</Text>
              <Text className="text-text-secondary text-xs mt-0.5">Active Trucks</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <MaterialCommunityIcons name="road-variant" size={28} color="#16A34A" />
              <Text className="text-text-primary font-bold text-2xl mt-2">12</Text>
              <Text className="text-text-secondary text-xs mt-0.5">Trips Today</Text>
            </View>
          </View>

          <View>
            {/* Section Header */}
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase ml-1 mt-2 mb-3">
              Fleet Management
            </Text>

            {/* Management Cards */}
            <View className="gap-3">
              {MANAGE_SECTIONS.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  activeOpacity={0.85}
                  className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm"
                  onPress={() => {
                    if (section.id === "drivers") {
                      router.push("/drivers");
                    } else if (section.id === "trucks") {
                      router.push("/trucks" as any);
                    } else if (section.id === "requests") {
                      router.push("/requests");
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
                    </View>

                    {/* Arrow */}
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Settings or Actions could go here */}
          <TouchableOpacity 
            activeOpacity={0.85}
            className="flex-row items-center justify-between bg-white rounded-2xl border border-border p-5 shadow-sm mt-2"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
                <Ionicons name="settings-outline" size={20} color="#64748B" />
              </View>
              <Text className="text-text-primary font-bold text-base">Account Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
