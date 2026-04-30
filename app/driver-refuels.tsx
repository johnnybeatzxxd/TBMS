import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

// Temporary mock data for driver
const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

const MOCK_REFUELS = [
  { id: "1", date: getPastDateStr(0), station: "TotalEnergies - Bole", amountLiters: "200", totalCost: "800.00" },
  { id: "2", date: getPastDateStr(2), station: "NOC - Kality", amountLiters: "150", totalCost: "600.00" },
];

const getGroupedData = (data: typeof MOCK_REFUELS) => {
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, typeof MOCK_REFUELS>);

  return Object.entries(grouped).map(([date, t]) => ({
    title: date,
    data: t,
  }));
};

const RefuelCard = ({ refuel }: { refuel: typeof MOCK_REFUELS[0] }) => {
  return (
    <View className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center mr-3">
            <Ionicons name="water" size={20} color="#F59E0B" />
          </View>
          <View>
            <Text className="text-text-primary font-bold text-base">{refuel.station}</Text>
            <Text className="text-text-secondary text-xs mt-0.5">{refuel.amountLiters} Liters</Text>
          </View>
        </View>
        <Text className="text-amber-600 font-bold text-lg">${refuel.totalCost}</Text>
      </View>
    </View>
  );
};

export default function DriverRefuelsScreen() {
  const [loading, setLoading] = useState(true);
  const [refuels, setRefuels] = useState<typeof MOCK_REFUELS>([]);

  useEffect(() => {
    setTimeout(() => {
      setRefuels(MOCK_REFUELS);
      setLoading(false);
    }, 500);
  }, []);

  const sections = getGroupedData(refuels);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm z-50">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="gas-station" size={26} color="#F59E0B" />
        <Text className="text-text-primary font-bold text-xl ml-2">My Refuels</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.id + index}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1 mt-6">
              {title}
            </Text>
          )}
          renderItem={({ item }) => <RefuelCard refuel={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
               <Text className="text-text-secondary">No refuels logged yet.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/add-refuel")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-amber-500 rounded-full items-center justify-center shadow-lg border border-amber-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
