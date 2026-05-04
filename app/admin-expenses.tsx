import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SectionList, RefreshControl } from "react-native";
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
    iconColor = "#1E3A8A"; // Dark blue
    iconBg = "bg-blue-50"; // Light blue background
    iconBorder = "border-blue-100";
  } else if (expenseTitle.includes("Road Expense")) {
    iconName = "car-outline"; // Assuming car-outline fits, or "map-outline"
    iconColor = "#10B981"; // Emerald green
    iconBg = "bg-emerald-50";
    iconBorder = "border-emerald-100";
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
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [displayedExpenses, setDisplayedExpenses] = useState<Expense[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Date Filter State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const isDriver = user?.role === "driver";
  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const loadInitialData = async () => {
    setLoadingInitial(true);
    setPage(1);
    try {
      const res = await mockExpenseService.getMyExpenses();
      // Apply filters first
      const sorted = [...res.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllExpenses(sorted);
      
      // Simulate pagination slice
      const limit = 6;
      const initialSlice = sorted.slice(0, limit);
      setDisplayedExpenses(initialSlice);
      setHasMore(sorted.length > limit);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load expenses");
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const nextPage = page + 1;
    const limit = 6;
    const start = (nextPage - 1) * limit;
    const end = start + limit;
    
    const nextSlice = filteredDataFull.slice(start, end);
    
    if (nextSlice.length > 0) {
      setDisplayedExpenses(prev => {
        const newItems = nextSlice.filter(item => !prev.some(p => p.id === item.id));
        return [...prev, ...newItems];
      });
      setPage(nextPage);
      setHasMore(filteredDataFull.length > end);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When filters change, we reset pagination and re-apply filters to the full set
  const filteredDataFull = useMemo(() => 
    allExpenses.filter(exp => passesDateFilter(exp.date, filterPreset, customFrom, customTo)),
    [allExpenses, filterPreset, customFrom, customTo]
  );

  useEffect(() => {
    // Sync displayed with filtered on first page
    const limit = 6;
    const firstSlice = filteredDataFull.slice(0, limit);
    setDisplayedExpenses(firstSlice);
    setPage(1);
    setHasMore(filteredDataFull.length > limit);
  }, [filteredDataFull]);

  const groupedExpenses = displayedExpenses.reduce((acc, exp) => {
    if (!acc[exp.date]) acc[exp.date] = [];
    acc[exp.date].push(exp);
    return acc;
  }, {} as Record<string, typeof displayedExpenses>);

  const expenseGroups = Object.entries(groupedExpenses).map(([date, exps]) => ({
    dateStr: date,
    title: getRelativeDateLabel(date),
    data: exps,
  }));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
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
        onPresetChange={(preset) => {
          setFilterPreset(preset);
          if (preset === "all") {
            setCustomFrom(null);
            setCustomTo(null);
            loadInitialData(); // Fresh fetch
          }
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {/* Content */}
      <SectionList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        sections={expenseGroups}
        keyExtractor={(item, index) => item.id + index}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-5 mb-2 mt-6">
            {title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="px-4">
            <ExpenseCard exp={item} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6 items-center flex-row justify-center gap-2">
              <ActivityIndicator size="small" color="#0EA5E9" />
              <Text className="text-text-secondary text-sm font-medium tracking-wide">Loading more expenses...</Text>
            </View>
          ) : !hasMore && displayedExpenses.length > 0 ? (
            <View className="py-6 items-center">
              <Text className="text-text-secondary/50 text-xs tracking-wide">No more expenses to show</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loadingInitial ? (
            <View className="py-20 items-center justify-center opacity-60">
              <Ionicons name="wallet-outline" size={64} color="#94A3B8" />
              <Text className="text-text-secondary text-base mt-4 text-center">
                No expenses found matching filters.
              </Text>
            </View>
          ) : (
            <View className="py-20 items-center justify-center gap-3">
               <ActivityIndicator size="large" color="#0EA5E9" />
               <Text className="text-text-secondary tracking-widest uppercase text-xs font-bold">Loading expenses...</Text>
            </View>
          )
        }
      />

      {/* FAB - Add Expense - Available for all relevant roles */}
      {(isDriver || isAdminOrManager) && (
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
