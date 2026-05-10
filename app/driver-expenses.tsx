import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Pressable, ActivityIndicator, SectionList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { expenseService } from "@/src/api/services";
import { DateFilterBar, DateFilterPreset } from "@/src/components/DateFilterBar";
import { TextInput } from "react-native";

import { Expense } from "@/src/types";

const getGroupedData = (data: Expense[]) => {
  const grouped = data.reduce((acc, item) => {
    const dStr = new Date(item.date).toLocaleDateString();
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(item);
    return acc;
  }, {} as Record<string, Expense[]>);

  return Object.entries(grouped).map(([date, t]) => ({
    title: date,
    data: t,
  }));
};

const ExpenseCard = ({ expense }: { expense: Expense }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  let expenseTitle = expense.serviceRequest?.serviceType?.name || "Expense";
  let expenseDesc = expense.remark || expense.serviceRequest?.description || "";
  
  if (expense.remark && expense.remark.includes(" | Desc: ")) {
     const parts = expense.remark.split(" | Desc: ");
     expenseTitle = parts[0];
     expenseDesc = parts[1];
  } else if (!expense.serviceRequest && expense.remark && expense.remark.includes(" | ")) {
     const parts = expense.remark.split(" | ");
     expenseTitle = parts[0];
     expenseDesc = parts[1];
  } else if (!expense.serviceRequest && expense.remark) {
     expenseTitle = expense.remark;
     expenseDesc = "";
  }

  const dynamicData = expense.dynamicData || expense.serviceRequest?.dynamicData || null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setIsExpanded(!isExpanded)}
      className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm p-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-2">
          <View className="w-10 h-10 bg-danger-50 rounded-xl items-center justify-center mr-3">
            <Ionicons name="receipt" size={20} color="#DC2626" />
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>{expenseTitle}</Text>
            <Text className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${expense.approved === 'APPROVED' ? 'text-primary' : 'text-amber-500'}`}>
              {expense.approved}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-danger-600 font-bold text-lg mb-0.5">
            ${expense.amount.toFixed(2)}
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#94A3B8" 
          />
        </View>
      </View>

      {isExpanded && (
        <View className="mt-3 pt-3 border-t border-border/50 gap-2">
          {expenseDesc ? (
            <Text className="text-text-secondary text-sm leading-5">
              {expenseDesc}
            </Text>
          ) : null}

          {dynamicData && Object.keys(dynamicData).length > 0 && (
            <View className="mt-2 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Form Details</Text>
              {Object.entries(dynamicData).map(([key, value]) => (
                <View key={key} className="flex-row justify-between mb-1.5">
                  <Text className="text-sm text-text-secondary">{key}:</Text>
                  <Text className="text-sm text-text-primary font-medium">{String(value)}</Text>
                </View>
              ))}
            </View>
          )}

          {expense.receiptPic && (
            <View className="mt-2">
              <Text className="text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Receipt</Text>
              <Text className="text-sm text-primary underline">View Receipt</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function DriverExpensesScreen() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [approvedFilter, setApprovedFilter] = useState<"PENDING" | "APPROVED" | "ALL">("ALL");
  const [amountFrom, setAmountFrom] = useState<string>("");
  const [amountTo, setAmountTo] = useState<string>("");

  const loadExpenses = async () => {
    try {
      const filters: any = {};
      const now = new Date();
      if (filterPreset === "today") {
         filters.startDate = new Date(now.setHours(0,0,0,0)).toISOString();
         filters.endDate = new Date(now.setHours(23,59,59,999)).toISOString();
      } else if (filterPreset === "week") {
         const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
         filters.startDate = weekAgo.toISOString();
         filters.endDate = new Date(now.setHours(23,59,59,999)).toISOString();
      } else if (filterPreset === "month") {
         const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1);
         filters.startDate = monthAgo.toISOString();
         filters.endDate = new Date(now.setHours(23,59,59,999)).toISOString();
      } else if (filterPreset === "custom" && customFrom && customTo) {
         filters.startDate = customFrom.toISOString();
         filters.endDate = customTo.toISOString();
      }

      if (approvedFilter !== "ALL") filters.approved = approvedFilter;
      if (amountFrom) filters.amountFrom = Number(amountFrom);
      if (amountTo) filters.amountTo = Number(amountTo);

      const res = await expenseService.getMyExpenses(filters);
      const sorted = [...res.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(sorted);
    } catch (error) {
      console.log("Failed to load expenses", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  useEffect(() => {
    if (filterPreset !== "custom" || (filterPreset === "custom" && customFrom && customTo)) {
      loadExpenses();
    }
  }, [filterPreset, customFrom, customTo]);

  const sections = getGroupedData(expenses);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm z-50">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
            <Ionicons name="arrow-back" size={20} color="#334155" />
          </TouchableOpacity>
          <MaterialCommunityIcons name="cash-multiple" size={26} color="#DC2626" />
          <Text className="text-text-primary font-bold text-xl ml-2">My Expenses</Text>
        </View>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} className="bg-surface p-2 rounded-xl border border-border">
          <Ionicons name="filter" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* Extended Filters */}
      {showFilters && (
        <View className="bg-white px-5 py-4 border-b border-border shadow-sm z-40 gap-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold tracking-widest text-text-secondary uppercase mb-1">Status</Text>
              <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 4 }}>
                <TouchableOpacity
                  onPress={() => setApprovedFilter("ALL")}
                  style={{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: approvedFilter === "ALL" ? '#FFFFFF' : 'transparent', elevation: approvedFilter === "ALL" ? 1 : 0 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: approvedFilter === "ALL" ? '#DC2626' : '#64748B' }}>ALL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setApprovedFilter("PENDING")}
                  style={{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: approvedFilter === "PENDING" ? '#FFFFFF' : 'transparent', elevation: approvedFilter === "PENDING" ? 1 : 0 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: approvedFilter === "PENDING" ? '#DC2626' : '#64748B' }}>PENDING</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setApprovedFilter("APPROVED")}
                  style={{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: approvedFilter === "APPROVED" ? '#FFFFFF' : 'transparent', elevation: approvedFilter === "APPROVED" ? 1 : 0 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: approvedFilter === "APPROVED" ? '#DC2626' : '#64748B' }}>APPROVED</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold tracking-widest text-text-secondary uppercase mb-1">Min Amount</Text>
              <TextInput
                value={amountFrom}
                onChangeText={setAmountFrom}
                keyboardType="numeric"
                placeholder="0"
                className="bg-surface border border-border rounded-xl h-10 px-3 text-sm text-text-primary"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold tracking-widest text-text-secondary uppercase mb-1">Max Amount</Text>
              <TextInput
                value={amountTo}
                onChangeText={setAmountTo}
                keyboardType="numeric"
                placeholder="No limit"
                className="bg-surface border border-border rounded-xl h-10 px-3 text-sm text-text-primary"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => { setShowFilters(false); loadExpenses(); }}
            className="bg-danger rounded-xl py-3 mt-2 items-center"
          >
            <Text className="text-white font-bold">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Filter */}
      <View className="z-0">
      <DateFilterBar
        activePreset={filterPreset}
        onPresetChange={(preset) => {
          setFilterPreset(preset);
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />
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

    </SafeAreaView>
  );
}
