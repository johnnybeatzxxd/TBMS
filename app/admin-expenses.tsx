import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, Pressable, ScrollView, ActivityIndicator, Alert, SectionList, RefreshControl, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore, useCacheStore } from "@/src/store";
import { expenseService, truckService, formService } from "@/src/api/services";
import { Expense } from "@/src/types";
import { DateFilterBar, DateFilterPreset } from "@/src/components/DateFilterBar";
import { ReceiptPhotosRow } from "@/src/components/TripReceiptViewer";

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

  let expenseTitle = exp.serviceRequest?.serviceType?.name || (exp.tag ? exp.tag : "Expense");
  let expenseDesc = exp.remark || exp.serviceRequest?.description || "No description provided.";
  
  if (exp.remark && exp.remark.includes(" | Desc: ")) {
     const parts = exp.remark.split(" | Desc: ");
     expenseTitle = parts[0];
     expenseDesc = parts[1];
  } else if (!exp.serviceRequest && exp.remark && exp.remark.includes(" | ")) {
     const parts = exp.remark.split(" | ");
     expenseTitle = parts[0];
     expenseDesc = parts[1];
  } else if (!exp.serviceRequest && exp.remark) {
     expenseTitle = exp.remark;
     expenseDesc = "";
  }

  const truckLabel = exp.truck?.plateNumber || exp.truckId.replace("trk_", "Truck ");
  const dynamicData = exp.dynamicData || exp.serviceRequest?.dynamicData || null;

  let iconName = "receipt-outline";
  let iconColor = "#64748B";
  let iconBg = "bg-slate-100";
  let iconBorder = "border-slate-200";

  if (expenseTitle.includes("Refuel")) {
    iconName = "water-outline";
    iconColor = "#0EA5E9";
    iconBg = "bg-sky-50";
    iconBorder = "border-sky-100";
  } else if (expenseTitle.includes("Maintenance") || expenseTitle.toLowerCase().includes("engine") || expenseTitle.toLowerCase().includes("repair")) {
    iconName = "build-outline";
    iconColor = "#1E3A8A";
    iconBg = "bg-blue-50";
    iconBorder = "border-blue-100";
  } else if (expenseTitle.includes("Road Expense") || expenseTitle.includes("Toll")) {
    iconName = "car-outline";
    iconColor = "#10B981";
    iconBg = "bg-emerald-50";
    iconBorder = "border-emerald-100";
  } else if (expenseTitle === "PERDIME") {
    iconName = "calendar-clock";
    iconColor = "#0EA5E9";
    iconBg = "bg-sky-50";
    iconBorder = "border-sky-100";
  } else if (expenseTitle === "SALARY") {
    iconName = "wallet-outline";
    iconColor = "#8B5CF6";
    iconBg = "bg-purple-50";
    iconBorder = "border-purple-100";
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
            <View className="flex-row items-center mt-0.5">
              <Text className="text-text-secondary text-xs">
                {truckLabel}
              </Text>
              <View className="w-1 h-1 rounded-full bg-border mx-2" />
              <Text className={`text-[10px] font-bold tracking-widest uppercase ${exp.approved === 'APPROVED' ? 'text-primary' : 'text-amber-500'}`}>
                {exp.approved}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-danger font-bold text-lg mb-0.5">
            - ${exp.amount.toFixed(2)}
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
          <View className="bg-surface rounded-xl p-3 border border-border/30 gap-2">
            {expenseDesc ? (
              <Text className="text-text-secondary text-sm leading-5">
                {expenseDesc}
              </Text>
            ) : null}

            {dynamicData && Object.keys(dynamicData).length > 0 && (
              <View className="mt-2 bg-white rounded-lg p-3 border border-border">
                <Text className="text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Form Details</Text>
                {Object.entries(dynamicData).map(([key, value]) => (
                  <View key={key} className="flex-row justify-between mb-1.5">
                    <Text className="text-sm text-text-secondary">{key}:</Text>
                    <Text className="text-sm text-text-primary font-medium">{String(value)}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {exp.receiptPic && (
              <View className="mt-2">
                <ReceiptPhotosRow receiptPic={exp.receiptPic} label="Receipt" />
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function ExpensesScreen() {
  const { user } = useAuthStore();
  const { expenses: cachedExpenses, setExpenses: setCachedExpenses } = useCacheStore();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [displayedExpenses, setDisplayedExpenses] = useState<Expense[]>(cachedExpenses);
  const [loadingInitial, setLoadingInitial] = useState(cachedExpenses.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const [approvedFilter, setApprovedFilter] = useState<"PENDING" | "APPROVED" | "ALL">("ALL");
  const [amountFrom, setAmountFrom] = useState<string>("");
  const [amountTo, setAmountTo] = useState<string>("");
  const [selectedTruckIds, setSelectedTruckIds] = useState<string[]>([]);
  const [trucks, setTrucks] = useState<any[]>([{ id: "all", plateNumber: "All Trucks" }]);
  const [forms, setForms] = useState<any[]>([{ id: "all", name: "All Forms" }]);
  const [selectedFormId, setSelectedFormId] = useState<string>("all");
  const [showFormMenu, setShowFormMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTruckMenu, setShowTruckMenu] = useState(false);
  const [draftTruckIds, setDraftTruckIds] = useState<string[]>([]);

  const isDriver = user?.role === "driver";
  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    if (isAdminOrManager) {
      truckService.getMyTrucks().then(res => {
        if ("trucks" in res) setTrucks([{ id: "all", plateNumber: "All Trucks" }, ...res.trucks]);
      }).catch(() => {});
    }
  }, [isAdminOrManager]);

  useEffect(() => {
    expenseService.getServiceRequestNames().then(res => {
      console.log("Successfully fetched form names:", res);
      if (res && res.serviceTypes) {
        setForms([{ id: "all", name: "All Forms" }, ...res.serviceTypes]);
      }
    }).catch((err) => {
      console.error("Failed to load form names in component:", err);
    });
  }, []);

  const truckById = useMemo(
    () => Object.fromEntries(trucks.filter(t => t.id !== "all").map((t) => [t.id, t.plateNumber])),
    [trucks]
  );

  const selectedTruckLabel = useMemo(() => {
    if (selectedTruckIds.length === 0) return "All Trucks";
    if (selectedTruckIds.length === 1) return truckById[selectedTruckIds[0]] || "1 Truck";
    return `${selectedTruckIds.length} Trucks`;
  }, [selectedTruckIds, truckById]);

  const isDraftAllTrucks = draftTruckIds.length === 0;

  const openTruckMenu = () => {
    setDraftTruckIds([...selectedTruckIds]);
    setShowTruckMenu(true);
  };

  const closeTruckMenu = () => setShowTruckMenu(false);

  const applyTruckSelection = () => {
    setSelectedTruckIds([...draftTruckIds]);
    closeTruckMenu();
  };

  const toggleDraftTruck = (truckId: string) => {
    const selected = new Set(draftTruckIds);
    if (selected.has(truckId)) {
      selected.delete(truckId);
    } else {
      selected.add(truckId);
    }
    setDraftTruckIds(Array.from(selected));
  };

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
      if (selectedTruckIds.length > 0) filters.truckIds = selectedTruckIds;
      if (selectedFormId !== "all") filters.serviceTypeId = selectedFormId;

      const res = await expenseService.getMyExpenses(filters);
      const sorted = [...res.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllExpenses(sorted);
      
      const limit = 6;
      const initialSlice = sorted.slice(0, limit);
      setDisplayedExpenses(initialSlice);
      setHasMore(sorted.length > limit);
      
      if (Object.keys(filters).length === 0) setCachedExpenses(initialSlice);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load expenses");
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const nextPage = page + 1;
    const limit = 6;
    const start = (nextPage - 1) * limit;
    const end = start + limit;
    
    const nextSlice = allExpenses.slice(start, end);
    
    if (nextSlice.length > 0) {
      setDisplayedExpenses(prev => {
        const newItems = nextSlice.filter(item => !prev.some(p => p.id === item.id));
        return [...prev, ...newItems];
      });
      setPage(nextPage);
      setHasMore(allExpenses.length > end);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  // Re-fetch when preset changes or when custom dates change (if preset is custom)
  useEffect(() => {
    if (filterPreset !== "custom" || (filterPreset === "custom" && customFrom && customTo)) {
      loadInitialData();
    }
  }, [filterPreset, customFrom, customTo, selectedTruckIds]);

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
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm z-50">
        <View className="flex-row items-center flex-1 pr-2">
          <Ionicons name="receipt" size={26} color="#2563EB" />
          <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide" numberOfLines={1}>
            Expenses
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {isAdminOrManager && (
            <View className="relative z-50">
              <TouchableOpacity
                onPress={() => (showTruckMenu ? closeTruckMenu() : openTruckMenu())}
                className="flex-row items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2"
                activeOpacity={0.8}
              >
                <Ionicons name="car-sport" size={14} color="#2563EB" />
                <Text className="text-blue-600 font-semibold text-xs max-w-[88px]" numberOfLines={1}>
                  {selectedTruckLabel}
                </Text>
                <Ionicons name={showTruckMenu ? "chevron-up" : "chevron-down"} size={14} color="#2563EB" />
              </TouchableOpacity>

              {showTruckMenu && (
                <View className="absolute right-0 top-10 bg-white rounded-2xl border border-border shadow-lg overflow-hidden min-w-[200px] z-[999] elevation-20">
                  <TouchableOpacity
                    onPress={() => setDraftTruckIds([])}
                    className={`px-4 py-3 flex-row items-center gap-2 border-b border-border/50 ${
                      isDraftAllTrucks ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <Ionicons
                      name={isDraftAllTrucks ? "checkbox" : "square-outline"}
                      size={18}
                      color={isDraftAllTrucks ? "#2563EB" : "#64748B"}
                    />
                    <Text
                      className={`text-sm flex-1 ${
                        isDraftAllTrucks ? "text-blue-600 font-bold" : "text-text-primary font-medium"
                      }`}
                    >
                      All Trucks
                    </Text>
                  </TouchableOpacity>
                  <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                    {trucks.filter(t => t.id !== "all").map((truck) => {
                      const checked = draftTruckIds.includes(truck.id);
                      return (
                        <TouchableOpacity
                          key={truck.id}
                          onPress={() => toggleDraftTruck(truck.id)}
                          className={`px-4 py-3 flex-row items-center gap-2 ${
                            checked ? "bg-blue-50" : "bg-white"
                          }`}
                        >
                          <Ionicons
                            name={checked ? "checkbox" : "square-outline"}
                            size={18}
                            color={checked ? "#2563EB" : "#64748B"}
                          />
                          <Text
                            className={`text-sm flex-1 ${
                              checked ? "text-blue-600 font-bold" : "text-text-primary font-medium"
                            }`}
                          >
                            {truck.plateNumber}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={applyTruckSelection}
                    className="px-4 py-2.5 bg-blue-600 border-t border-blue-600 items-center"
                  >
                    <Text className="text-white font-semibold text-sm">Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} className="bg-surface p-2 rounded-xl border border-border">
            <Ionicons name="filter" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
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
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: approvedFilter === "ALL" ? '#2563EB' : '#64748B' }}>ALL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setApprovedFilter("PENDING")}
                  style={{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: approvedFilter === "PENDING" ? '#FFFFFF' : 'transparent', elevation: approvedFilter === "PENDING" ? 1 : 0 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: approvedFilter === "PENDING" ? '#2563EB' : '#64748B' }}>PENDING</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setApprovedFilter("APPROVED")}
                  style={{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: approvedFilter === "APPROVED" ? '#FFFFFF' : 'transparent', elevation: approvedFilter === "APPROVED" ? 1 : 0 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: approvedFilter === "APPROVED" ? '#2563EB' : '#64748B' }}>APPROVED</Text>
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

          {/* Form Filter */}
          <View className="z-50 relative mt-2">
            <Text className="text-xs font-bold tracking-widest text-text-secondary uppercase mb-1">By Form</Text>
            <TouchableOpacity
              onPress={() => setShowFormMenu(!showFormMenu)}
              className="bg-surface border border-border rounded-xl h-10 px-3 flex-row items-center justify-between"
            >
              <Text className="text-sm text-text-primary">
                {forms.find(f => f.id === selectedFormId)?.name || "All Forms"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
            
            {showFormMenu && (
              <View className="absolute top-12 left-0 right-0 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-48">
                <ScrollView nestedScrollEnabled>
                  {forms.map(f => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => {
                        setSelectedFormId(f.id);
                        setShowFormMenu(false);
                      }}
                      className={`px-4 py-3 border-b border-border-light flex-row items-center justify-between ${selectedFormId === f.id ? "bg-primary-50" : ""}`}
                    >
                      <Text className={`text-sm ${selectedFormId === f.id ? "text-primary font-bold" : "text-text-primary"}`}>{f.name}</Text>
                      {selectedFormId === f.id && <Ionicons name="checkmark" size={16} color="#2563EB" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => { setShowFilters(false); loadInitialData(); }}
            className="bg-primary rounded-xl py-3 mt-2 items-center"
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

      {/* FAB - Add Expense - Only for Driver */}
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
