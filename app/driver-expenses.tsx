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

const MOCK_EXPENSES = [
  { id: "1", date: getPastDateStr(0), category: "Food & Drinks", amount: "150.00", notes: "Lunch on the road" },
  { id: "2", date: getPastDateStr(1), category: "Maintenance", amount: "1200.00", notes: "Tire repair" },
  { id: "3", date: getPastDateStr(2), category: "Toll", amount: "45.00", notes: "Highway toll" },
];

const getGroupedData = (data: typeof MOCK_EXPENSES) => {
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, typeof MOCK_EXPENSES>);

  return Object.entries(grouped).map(([date, t]) => ({
    title: date,
    data: t,
  }));
};

const ExpenseCard = ({ expense }: { expense: typeof MOCK_EXPENSES[0] }) => {
  return (
    <View className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-danger-50 rounded-xl items-center justify-center mr-3">
            <Ionicons name="receipt" size={20} color="#DC2626" />
          </View>
          <View>
            <Text className="text-text-primary font-bold text-base">{expense.category}</Text>
            {expense.notes ? (
               <Text className="text-text-secondary text-xs mt-0.5">{expense.notes}</Text>
            ) : null}
          </View>
        </View>
        <Text className="text-danger-600 font-bold text-lg">${expense.amount}</Text>
      </View>
    </View>
  );
};

export default function DriverExpensesScreen() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<typeof MOCK_EXPENSES>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setExpenses(MOCK_EXPENSES);
    setRefreshing(false);
  };

  useEffect(() => {
    setTimeout(() => {
      setExpenses(MOCK_EXPENSES);
      setLoading(false);
    }, 500);
  }, []);

  const sections = getGroupedData(expenses);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm z-50">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="cash-multiple" size={26} color="#DC2626" />
        <Text className="text-text-primary font-bold text-xl ml-2">My Expenses</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#DC2626" />
        </View>
      ) : (
        <SectionList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
          sections={sections}
          keyExtractor={(item, index) => item.id + index}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1 mt-6">
              {title}
            </Text>
          )}
          renderItem={({ item }) => <ExpenseCard expense={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
               <Text className="text-text-secondary">No expenses logged yet.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/add-expense")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-danger-600 rounded-full items-center justify-center shadow-lg border border-danger-700 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
