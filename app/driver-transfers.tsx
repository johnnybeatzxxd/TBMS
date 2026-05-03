import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, RefreshControl } from "react-native";
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

const MOCK_TRANSFERS = [
  { id: "1", date: getPastDateStr(0), recipient: "Head Office", amount: "500.00", method: "Bank Transfer", status: "Completed" },
  { id: "2", date: getPastDateStr(3), recipient: "Fuel Supplier", amount: "1200.00", method: "Cash Deposit", status: "Pending" },
];

const getGroupedData = (data: typeof MOCK_TRANSFERS) => {
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, typeof MOCK_TRANSFERS>);

  return Object.entries(grouped).map(([date, t]) => ({
    title: date,
    data: t,
  }));
};

const TransferCard = ({ transfer }: { transfer: typeof MOCK_TRANSFERS[0] }) => {
  return (
    <View className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-success-50 rounded-xl items-center justify-center mr-3">
            <Ionicons name="swap-horizontal" size={20} color="#16A34A" />
          </View>
          <View>
            <Text className="text-text-primary font-bold text-base">{transfer.recipient}</Text>
            <Text className="text-text-secondary text-xs mt-0.5">{transfer.method}</Text>
          </View>
        </View>
        <View className="items-end">
           <Text className="text-success-600 font-bold text-lg">${transfer.amount}</Text>
           <Text className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${transfer.status === "Completed" ? "text-success-600" : "text-amber-500"}`}>
             {transfer.status}
           </Text>
        </View>
      </View>
    </View>
  );
};

export default function DriverTransfersScreen() {
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<typeof MOCK_TRANSFERS>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setTransfers(MOCK_TRANSFERS);
    setRefreshing(false);
  };

  useEffect(() => {
    setTimeout(() => {
      setTransfers(MOCK_TRANSFERS);
      setLoading(false);
    }, 500);
  }, []);

  const sections = getGroupedData(transfers);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm z-50">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="bank-transfer" size={26} color="#16A34A" />
        <Text className="text-text-primary font-bold text-xl ml-2">My Transfers</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <SectionList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}
          sections={sections}
          keyExtractor={(item, index) => item.id + index}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1 mt-6">
              {title}
            </Text>
          )}
          renderItem={({ item }) => <TransferCard transfer={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
               <Text className="text-text-secondary">No transfers logged yet.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/add-transfer")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-success-600 rounded-full items-center justify-center shadow-lg border border-success-700 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
