import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { mockExpenseService } from "@/src/api/mock/expenses.mock";
import { Expense } from "@/src/types";

const getRelativeDateLabel = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return dateStr;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

export default function ExpensesScreen() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Note: Only DRIVERS should technically add expenses according to API docs,
  // but we can allow Managers to view them.
  const isDriver = user?.role === "driver";

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await mockExpenseService.getMyExpenses();
      setExpenses(res.expenses);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const groupedExpenses = expenses.reduce((acc, exp) => {
    if (!acc[exp.date]) acc[exp.date] = [];
    acc[exp.date].push(exp);
    return acc;
  }, {} as Record<string, typeof expenses>);

  const expenseGroups = Object.entries(groupedExpenses).map(([date, exps]) => ({
    dateStr: date,
    title: getRelativeDateLabel(date),
    data: exps,
  }));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <View className="flex-row items-center">
          <Ionicons name="receipt" size={26} color="#2563EB" />
          <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide">
            Expenses
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {expenseGroups.length === 0 ? (
            <View className="items-center justify-center py-20 opacity-60">
              <Ionicons name="wallet-outline" size={64} color="#94A3B8" />
              <Text className="text-text-secondary text-base mt-4 text-center">
                No expenses logged yet.
              </Text>
            </View>
          ) : (
            expenseGroups.map((group) => (
              <View key={group.dateStr} className="mb-6">
                <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-2">
                  {group.title}
                </Text>
                {group.data.map((exp) => (
                  <View
                    key={exp.id}
                    className="bg-white p-4 rounded-2xl mb-3 border border-border shadow-sm"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1 pr-2">
                        <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3 border border-slate-200">
                          <Ionicons name="cart-outline" size={18} color="#64748B" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-text-primary font-bold text-base">
                            Expense
                          </Text>
                          <Text className="text-text-secondary text-xs">
                            Truck: {exp.truckId}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-danger font-bold text-lg">
                        - ${exp.price.toFixed(2)}
                      </Text>
                    </View>
                    <View className="bg-surface rounded-xl p-3 border border-border/50">
                      <Text className="text-text-secondary text-sm leading-5">
                        {exp.remark}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB - Add Expense - Only for Drivers */}
      {isDriver && (
        <TouchableOpacity
          onPress={() => router.push("/add-expense")}
          activeOpacity={0.8}
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg border border-primary-600 elevation-5"
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
