import { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Truck } from "@/src/types";
import { truckService } from "@/src/api/services";
import { useCachedFetch } from "@/src/hooks/useCachedFetch";

export default function TrucksListScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: trucksRes, isLoading: loading, refetch } = useCachedFetch(
    "TRUCKS",
    truckService.getMyTrucks,
    { trucks: [] } as any
  );
  
  const trucks = trucksRes?.trucks || [];

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const displayTrucks = useMemo(() => {
    if (!searchQuery) return trucks;
    const q = searchQuery.toLowerCase();
    return trucks.filter(
      (t: Truck) =>
        t.plateNumber.toLowerCase().includes(q) ||
        (t.vinNumber && t.vinNumber.toLowerCase().includes(q)) ||
        (t.brand && t.brand.toLowerCase().includes(q)) ||
        (t.model && t.model.toLowerCase().includes(q))
    );
  }, [trucks, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
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
            <Text className="text-text-primary font-bold text-2xl tracking-tight">Trucks</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-2 border border-border">
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-2 text-text-primary text-sm py-1.5"
            placeholder="Search by plate, VIN, brand..."
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
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {displayTrucks.length === 0 ? (
            <View className="items-center py-10">
              <Ionicons name="car-sport-outline" size={48} color="#CBD5E1" />
              <Text className="text-text-secondary font-medium mt-4 text-center">
                {trucks.length === 0 
                  ? "You have no trucks registered.\nTap the + button to add one." 
                  : "No trucks match your search."}
              </Text>
            </View>
          ) : (
            displayTrucks.map((truck: Truck) => (
              <TouchableOpacity
                key={truck.id}
                activeOpacity={0.85}
                onPress={() => {
                  router.push({
                    pathname: "/add-truck",
                    params: {
                      id: truck.id,
                      plateNumber: truck.plateNumber,
                      vinNumber: truck.vinNumber || "",
                      brand: truck.brand || "",
                      model: truck.model || "",
                    }
                  } as any);
                }}
                className="bg-white rounded-2xl border border-border shadow-sm p-4"
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-sky-50 rounded-full items-center justify-center mr-4 border border-sky-100">
                    <MaterialCommunityIcons name="truck" size={24} color="#0EA5E9" />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-text-primary font-bold text-lg">
                      {truck.plateNumber}
                    </Text>
                    {truck.brand || truck.model ? (
                      <Text className="text-text-secondary text-sm font-medium">
                        {[truck.brand, truck.model].filter(Boolean).join(" ")}
                      </Text>
                    ) : null}
                    {truck.vinNumber ? (
                      <Text className="text-text-tertiary text-xs">
                        VIN: {truck.vinNumber}
                      </Text>
                    ) : null}
                  </View>
                  <View className="bg-sky-50 p-2 rounded-full border border-sky-100 ml-2">
                    <Ionicons name="pencil" size={16} color="#0EA5E9" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB - Add Truck */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => router.push("/add-truck" as any)}
          className="bg-sky-500 w-14 h-14 rounded-full items-center justify-center shadow-md shadow-sky-500"
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
