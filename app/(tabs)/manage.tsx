import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { useCachedFetch } from "@/src/hooks/useCachedFetch";
import { View, Text, TouchableOpacity, ScrollView, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/src/store";
import { driverService, truckService, tripService } from "@/src/api/services";

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
    id: "companies",
    title: "Companies",
    description: "View and register contracted companies",
    icon: "domain",
    iconLib: "material",
    color: "#D97706",
    bgColor: "#FEF3C7",
    stat: "0 Total",
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
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveDrivers = useCallback(async () => {
    const res = await driverService.getMyDrivers();
    return (res.drivers || []).filter(d => d.accountActive).length;
  }, []);

  const fetchActiveTrucks = useCallback(async () => {
    const res = await truckService.getMyTrucks();
    return (res.trucks || []).length;
  }, []);

  const fetchTripsToday = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const res = await tripService.getTrips({
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });
    return res.meta.totalItems;
  }, []);

  const { data: activeDrivers, refetch: refetchDrivers } = useCachedFetch<number | string>("STAT_DRIVERS", fetchActiveDrivers, "...");
  const { data: activeTrucks, refetch: refetchTrucks } = useCachedFetch<number | string>("STAT_TRUCKS", fetchActiveTrucks, "...");
  const { data: tripsToday, refetch: refetchTrips } = useCachedFetch<number | string>("STAT_TRIPS", fetchTripsToday, "...");

  useFocusEffect(
    useCallback(() => {
      const { useAuthStore } = require("@/src/store/authStore");
      if (!useAuthStore.getState().isAuthenticated) return;
      if (isAdmin) {
        refetchDrivers();
        refetchTrucks();
        refetchTrips();
      }
    }, [isAdmin, refetchDrivers, refetchTrucks, refetchTrips])
  );

  const onRefresh = useCallback(async () => {
    if (!isAdmin) return;
    setRefreshing(true);
    await Promise.all([
      refetchDrivers(),
      refetchTrucks(),
      refetchTrips()
    ]);
    setRefreshing(false);
  }, [isAdmin, refetchDrivers, refetchTrucks, refetchTrips]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8">
        <Ionicons name="lock-closed-outline" size={48} color="#94A3B8" />
        <Text className="text-text-primary font-bold text-xl mt-4 text-center">
          Admins Only
        </Text>
        <Text className="text-text-secondary text-sm mt-2 text-center">
          This section is restricted to admin accounts.
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
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
                {user?.name ? user.name.charAt(0) : "A"}
              </Text>
            </View>

            {/* Name */}
            <Text className="text-white text-2xl font-bold tracking-wide">
              {user?.name || "Admin"}
            </Text>
            <Text className="text-white/60 text-sm mt-0.5">@{user?.username}</Text>

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
              <Text className="text-text-primary font-bold text-2xl mt-2">{activeDrivers}</Text>
              <Text className="text-text-secondary text-xs mt-0.5 whitespace-nowrap">Active Drivers</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <MaterialCommunityIcons name="truck-outline" size={28} color="#0EA5E9" />
              <Text className="text-text-primary font-bold text-2xl mt-2">{activeTrucks}</Text>
              <Text className="text-text-secondary text-xs mt-0.5">Trucks</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4 items-center shadow-sm">
              <MaterialCommunityIcons name="road-variant" size={28} color="#16A34A" />
              <Text className="text-text-primary font-bold text-2xl mt-2">{tripsToday}</Text>
              <Text className="text-text-secondary text-xs mt-0.5 whitespace-nowrap">Trips Today</Text>
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
                    } else if (section.id === "companies") {
                      router.push("/companies" as any);
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

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.85}
            className="flex-row items-center gap-3 bg-white rounded-2xl border border-border p-5 shadow-sm mt-2"
          >
            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center border border-red-100">
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <Text className="flex-1 text-red-600 font-bold text-base">Sign Out</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
