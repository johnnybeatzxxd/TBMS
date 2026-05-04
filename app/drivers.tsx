import { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Driver, Truck } from "@/src/types";
import { driverService, truckService } from "@/src/api/services";
import { useCachedFetch } from "@/src/hooks/useCachedFetch";

export default function DriversListScreen() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"All" | "Active" | "Inactive">("All");

  const { data: driversRes, isLoading: driversLoading, refetch: refetchDrivers } = useCachedFetch(
    "DRIVERS", 
    driverService.getMyDrivers, 
    { drivers: [] } as any
  );
  
  const { data: trucksRes, isLoading: trucksLoading, refetch: refetchTrucks } = useCachedFetch(
    "TRUCKS", 
    truckService.getMyTrucks, 
    { trucks: [] } as any
  );

  const drivers = driversRes?.drivers || [];
  const truckList = trucksRes?.trucks || [];

  const trucks = useMemo(() => {
    const map: Record<string, Truck> = {};
    truckList.forEach((t: Truck) => {
      map[t.id] = t;
    });
    return map;
  }, [truckList]);

  const loading = driversLoading || trucksLoading;

  const fetchData = async () => {
    await Promise.all([refetchDrivers(), refetchTrucks()]);
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      const { useAuthStore } = require("@/src/store/authStore");
      if (!useAuthStore.getState().isAuthenticated) return;
      refetchDrivers();
      refetchTrucks();
    }, [refetchDrivers, refetchTrucks])
  );

  const handleToggleStatus = async (driver: Driver) => {
    setActionLoading(driver.id);
    try {
      if (driver.accountActive) {
        await driverService.deactivateDriver(driver.id);
      } else {
        await driverService.activateDriver(driver.id);
      }
      await fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (driver: Driver) => {
    Alert.alert(
      "Delete Driver",
      `Are you sure you want to delete ${driver.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setActionLoading(driver.id);
            try {
              await driverService.deleteDriver(driver.id);
              await fetchData();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete driver");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // Filtered and Seached List
  const displayDrivers = useMemo(() => {
    return drivers.filter((d: Driver) => {
      // 1. Tab Filtering
      if (filterTab === "Active" && !d.accountActive) return false;
      if (filterTab === "Inactive" && d.accountActive) return false;

      // 2. Search filtering
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const truck = trucks[d.truckId];
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesTruck = truck?.plateNumber.toLowerCase().includes(q) || truck?.vinNumber?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesTruck) return false;
      }
      return true;
    });
  }, [drivers, filterTab, searchQuery, trucks]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="px-4 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-2xl tracking-tight">Drivers</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-2 border border-border">
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-2 text-text-primary text-sm py-1.5"
            placeholder="Search drivers or trucks..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View className="flex-row gap-2 mt-4">
          {(["All", "Active", "Inactive"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilterTab(tab)}
              className={`px-4 py-1.5 rounded-full border ${
                filterTab === tab
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filterTab === tab ? "text-white" : "text-text-secondary"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 mb-24 mt-2"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        >
          {displayDrivers.length === 0 ? (
            <View className="items-center py-10">
              <Ionicons name="people-outline" size={48} color="#CBD5E1" />
              <Text className="text-text-secondary font-medium mt-4">No drivers found.</Text>
            </View>
          ) : (
            displayDrivers.map((driver: Driver) => {
              const assignedTruck = trucks[driver.truckId];

              return (
                <TouchableOpacity
                  key={driver.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/driver-detail?id=${driver.id}` as any)}
                  className="bg-white rounded-2xl border border-border shadow-sm p-4"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 flex-row items-center">
                      <View className="w-12 h-12 bg-primary-50 rounded-full items-center justify-center mr-3">
                        <Ionicons name="person" size={24} color="#2563EB" />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text className="text-text-primary font-bold text-lg">
                          {driver.name}
                        </Text>
                        <View className="flex-row items-center mt-0.5">
                          <Ionicons name="car-outline" size={12} color="#64748B" />
                          <Text className="text-text-secondary text-xs ml-1 flex-1" numberOfLines={1}>
                            {assignedTruck 
                              ? `${assignedTruck.plateNumber}${assignedTruck.vinNumber ? ` - ${assignedTruck.vinNumber}` : ""}`
                              : "No truck assigned"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {/* Status Badge */}
                    <View
                      className={`px-2.5 py-1 rounded-full border ${
                        driver.accountActive
                          ? "bg-success-50 border-success"
                          : "bg-danger-50 border-danger"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          driver.accountActive ? "text-success" : "text-danger"
                        }`}
                      >
                        {driver.accountActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  <View className="w-full h-[1px] bg-border my-2" />

                  {/* Action Buttons */}
                  <View className="flex-row items-center justify-between pt-2">
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleToggleStatus(driver)}
                        disabled={actionLoading === driver.id}
                        className={`px-4 py-2 flex-row items-center gap-1.5 rounded-lg border ${
                          driver.accountActive
                            ? "bg-surface border-border"
                            : "bg-success-50 border-success-100"
                        }`}
                      >
                        {actionLoading === driver.id ? (
                          <ActivityIndicator size="small" color={driver.accountActive ? "#64748B" : "#16A34A"} />
                        ) : (
                          <>
                            <Ionicons
                              name={driver.accountActive ? "pause" : "play"}
                              size={14}
                              color={driver.accountActive ? "#64748B" : "#16A34A"}
                            />
                            <Text
                              className={`text-xs font-semibold ${
                                driver.accountActive ? "text-text-secondary" : "text-success-600"
                              }`}
                            >
                              {driver.accountActive ? "Deactivate" : "Activate"}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDelete(driver)}
                        disabled={actionLoading === driver.id}
                        className="px-4 py-2 flex-row items-center gap-1.5 rounded-lg bg-danger-50 border border-danger-100"
                      >
                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        <Text className="text-danger font-semibold text-xs">Delete</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity
                      onPress={() => {
                        const qs = `?mode=edit&id=${driver.id}&name=${encodeURIComponent(driver.name)}&truckId=${encodeURIComponent(driver.truckId)}&username=${encodeURIComponent(driver.username || "")}&password=${encodeURIComponent(driver.password || "")}&licenseRenewalDate=${encodeURIComponent(driver.licenseRenewalDate || "")}&oilChangeDate=${encodeURIComponent(driver.oilChangeDate || "")}`;
                        router.push(`/manage-driver${qs}` as any);
                      }}
                      className="w-10 h-10 items-center justify-center bg-primary-50 rounded-full border border-primary-100"
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#2563EB" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* FAB - Add Driver */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => router.push("/manage-driver?mode=create" as any)}
          className="bg-primary w-14 h-14 rounded-full items-center justify-center shadow-md shadow-primary"
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
