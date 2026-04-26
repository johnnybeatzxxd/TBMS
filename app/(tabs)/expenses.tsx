import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { mockExpenseService } from "@/src/api/mock/expenses.mock";
import { Expense } from "@/src/types";
import { DateFilterBar, DateFilterPreset, passesDateFilter } from "@/src/components/DateFilterBar";

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

const ExpenseCard = ({ exp }: { exp: Expense }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const parts = exp.remark.split(" | Desc: ");
  const expenseTitle = parts.length > 1 ? parts[0] : "Expense";
  const expenseDesc = parts.length > 1 ? parts[1] : exp.remark;
  
  let iconName = "receipt-outline";
  let iconColor = "#64748B";
  let iconBg = "bg-slate-100";
  let iconBorder = "border-slate-200";

  if (expenseTitle.includes("Refuel")) {
    iconName = "water-outline";
    iconColor = "#0EA5E9";
    iconBg = "bg-sky-50";
    iconBorder = "border-sky-100";
  } else if (expenseTitle.includes("Maintenance")) {
    iconName = "build-outline";
    iconColor = "#F59E0B";
    iconBg = "bg-amber-50";
    iconBorder = "border-amber-100";
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setIsExpanded(!isExpanded)}
      className="bg-white p-4 rounded-2xl mb-3 border border-border shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-2">
          <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center mr-3 border ${iconBorder}`}>
            <Ionicons name={iconName as any} size={18} color={iconColor} />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
              {expenseTitle}
            </Text>
            <Text className="text-text-secondary text-xs">
              Truck: {exp.truckId}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-danger font-bold text-lg mb-0.5">
            - ${exp.price.toFixed(2)}
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#94A3B8" 
          />
        </View>
      </View>
      
      {isExpanded && (
        <View className="mt-3 pt-3 border-t border-border/50">
          <View className="bg-surface rounded-xl p-3 border border-border/30">
            <Text className="text-text-secondary text-sm leading-5">
              {expenseDesc}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
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

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const filteredExpenses = useMemo(() => 
    expenses.filter(exp => passesDateFilter(exp.date, filterPreset, customFrom, customTo)),
    [expenses, filterPreset, customFrom, customTo]
  );

  const groupedExpenses = filteredExpenses.reduce((acc, exp) => {
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

      {/* Date Filter */}
      <DateFilterBar
        activePreset={filterPreset}
        onPresetChange={setFilterPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

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
                  <ExpenseCard key={exp.id} exp={exp} />
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
