import { useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Truck } from "@/src/types";
import { mockTruckService } from "@/src/api/mock/trucks.mock";

export default function TrucksListScreen() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTrucks = async () => {
    setLoading(true);
    try {
      const res = await mockTruckService.getMyTrucks();
      if ("message" in res && !("trucks" in res)) {
        setTrucks([]);
      } else if ("trucks" in res) {
        setTrucks(res.trucks as Truck[]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load trucks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const displayTrucks = useMemo(() => {
    if (!searchQuery) return trucks;
    const q = searchQuery.toLowerCase();
    return trucks.filter(
      (t) =>
        t.plateNumber.toLowerCase().includes(q) ||
        (t.vinNumber && t.vinNumber.toLowerCase().includes(q))
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
            placeholder="Search by plate or VIN..."
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
            displayTrucks.map((truck) => (
              <View
                key={truck.id}
                className="bg-white rounded-2xl border border-border shadow-sm p-4 flex-row items-center"
              >
                <View className="w-12 h-12 bg-sky-50 rounded-full items-center justify-center mr-4 border border-sky-100">
                  <Ionicons name="car" size={24} color="#0EA5E9" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-bold text-lg">
                    {truck.plateNumber}
                  </Text>
                  <Text className="text-text-secondary text-xs mt-0.5">
                    VIN: {truck.vinNumber || "N/A"}
                  </Text>
                </View>
              </View>
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
