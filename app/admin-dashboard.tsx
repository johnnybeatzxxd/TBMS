import { View, Text, TouchableOpacity, ScrollView, Platform, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState, useEffect } from "react";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore, useCacheStore } from "@/src/store";
import { tripService, transferService, reminderService, expenseService, refuelService, formService } from "@/src/api/services";

const isPendingStatus = (value: unknown) =>
  typeof value === "string" && value.trim().toUpperCase() === "PENDING";

const isPendingItem = (item: any) =>
  isPendingStatus(item?.status) || isPendingStatus(item?.approved);

export default function AdminDashboardScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  // Redirect if wrong role somehow landed here
  useEffect(() => {
    if (user && user.role === 'driver') {
      router.replace('/driver-dashboard');
    }
  }, [user]);

  // Trap hardware back button — dashboard is root; back should exit app
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });
      return () => subscription.remove();
    }, [])
  );

  const [pendingTripsCount, setPendingTripsCount] = useState(0);
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);
  const [pendingRemindersCount, setPendingRemindersCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingRefuelsCount, setPendingRefuelsCount] = useState(0);
  const [pendingExpensesCount, setPendingExpensesCount] = useState(0);

  const { setTrips, setTransfers, setExpenses, setRefuels, setRequests } = useCacheStore();

  // Dynamically calculate KPIs and pre-fetch list data into the global cache
  useFocusEffect(
    useCallback(() => {
      const prefetchAllData = async () => {
        try {
          const [cashTripsRes, creditTripsRes, transfersRes, remindersRes, expensesRes, refuelsRes, requestsRes] = await Promise.allSettled([
            tripService.getTrips({ page: 1, paymentMethod: "CASH" }),
            tripService.getTrips({ page: 1, paymentMethod: "CREDIT" }),
            transferService.getTransfers({ page: 1 }),
            reminderService.getPendingRemindersAdmin(),
            expenseService.getMyExpenses(),
            refuelService.getRefuels({}),
            formService.getFormSubmissions()
          ]);
          
          // Trips (Both Cash and Credit)
          let cashTrips: any[] = [];
          let creditTrips: any[] = [];
          
          if (cashTripsRes.status === "fulfilled") {
            cashTrips = cashTripsRes.value.data || [];
            // Cache the default CASH trips into the global cache (since admin-trips default tab is CASH)
            setTrips(cashTrips);
          }
          if (creditTripsRes.status === "fulfilled") {
            creditTrips = creditTripsRes.value.data || [];
          }
          const allTrips = [...cashTrips, ...creditTrips];
          setPendingTripsCount(allTrips.filter(isPendingItem).length);

          // Transfers
          if (transfersRes.status === "fulfilled") {
            const fetchedTransfers = transfersRes.value.transfers || [];
            setTransfers(fetchedTransfers);
            setPendingTransfersCount(fetchedTransfers.filter(isPendingItem).length);
          }

          // Expenses
          if (expensesRes.status === "fulfilled") {
            const fetchedExpenses = expensesRes.value.expenses || [];
            setExpenses(fetchedExpenses);
            setPendingExpensesCount(fetchedExpenses.filter(isPendingItem).length);
          }

          // Refuels
          if (refuelsRes.status === "fulfilled") {
            const fetchedRefuels = refuelsRes.value.refuels || [];
            setRefuels(fetchedRefuels);
            setPendingRefuelsCount(fetchedRefuels.filter(isPendingItem).length);
          }

          // Service Requests
          if (requestsRes.status === "fulfilled") {
            const fetchedRequests = requestsRes.value.submissions || [];
            setRequests(fetchedRequests);
            setPendingRequestsCount(fetchedRequests.filter(isPendingItem).length);
          }

          // Reminders
          if (remindersRes.status === "fulfilled") {
            setPendingRemindersCount(remindersRes.value.pending?.length || 0);
          }
        } catch (e) {
          console.log("[Dashboard] Failed fetching modular KPIs locally:", e);
        }
      };
      prefetchAllData();
    }, [])
  );

  const totalActionable = pendingTripsCount + pendingTransfersCount + pendingRemindersCount + pendingRequestsCount + pendingRefuelsCount + pendingExpensesCount;

  const navSections = [
    {
      title: "Operations",
      items: [
        { id: "trips", title: "Trip Management", subtitle: "Review and approve driver logs", icon: "truck", route: "/admin-trips", color: "#3B82F6", unread: pendingTripsCount },
        { id: "requests", title: "Service Requests", subtitle: "Manage fleet maintenance", icon: "document-text", route: "/admin-requests", color: "#10B981", unread: pendingRequestsCount },
        { id: "refuels", title: "Refuels", subtitle: "Fuel consumption logs", icon: "water", route: "/admin-refuels", color: "#0EA5E9", unread: pendingRefuelsCount },
      ]
    },
    {
      title: "Finance",
      items: [
        { id: "expenses", title: "Expenses", subtitle: "Road and operational spendings", icon: "receipt", route: "/admin-expenses", color: "#EF4444", unread: pendingExpensesCount },
        { id: "transfers", title: "Money Transfers", subtitle: "Internal fleet balancing", icon: "swap-horizontal", route: "/admin-transfers", color: "#F59E0B", unread: pendingTransfersCount },
      ]
    },
    {
      title: "Administration",
      items: [
        { id: "manage", title: "System Configuration", subtitle: "Drivers, Trucks & Companies", icon: "settings", route: "/admin-manage", color: "#64748B", unread: 0 },
        { id: "forms", title: "Form Builder", subtitle: "Create custom request forms", icon: "construct", route: "/admin-forms", color: "#6366F1", unread: 0 },
        { id: "displays", title: "Billboard", subtitle: "Live driver announcement config", icon: "chatbubbles", route: "/admin-displays", color: "#3B82F6", unread: 0 },
        { id: "reminders", title: "Reminders", subtitle: "Alerts & Scheduled Notifs", icon: "notifications", route: "/admin-reminders", color: "#8B5CF6", unread: pendingRemindersCount },
        { id: "analytics", title: "Reports & Analytics", subtitle: "Export CSV and view fleet trends", icon: "bar-chart", route: "/admin-analytics", color: "#F43F5E", unread: 0 },
        { id: "commitments", title: "Financial Commitments", subtitle: "Manage recurring financial obligations", icon: "card", route: "/admin-commitments", color: "#10B981", unread: 0 },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["top","bottom"]}>
      <StatusBar style="light" />
      {/* Enterprise Header Banner */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4 bg-slate-900" style={{ zIndex: 10 }}>
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-11 h-11 rounded-xl bg-slate-800 items-center justify-center border border-slate-700">
             <Ionicons name="shield-checkmark" size={20} color="#38BDF8" />
          </View>
          <View>
            <Text className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">
              Control Panel
            </Text>
            <Text className="text-white text-lg font-bold tracking-tight">
              {user?.name || "Administrator"}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogout} 
          className="w-10 h-10 items-center justify-center bg-slate-800/80 rounded-xl border border-slate-700/80"
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={16} color="#F43F5E" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* KPI Quick Stats - Gives an analytical "Advanced" feel instantly */}
        <View className="px-5 pt-6 pb-2">
          <Text className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-3">Today Overview</Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm">
               <View className="flex-row items-center justify-between mb-2">
                 <Ionicons name="time" size={14} color="#F59E0B" />
                 <Text className="text-slate-400 text-[10px] font-bold uppercase">Pending</Text>
               </View>
               <Text className="text-slate-800 text-2xl font-black">{totalActionable}</Text>
            </View>
            <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm">
               <View className="flex-row items-center justify-between mb-2">
                 <MaterialCommunityIcons name="truck-check" size={14} color="#10B981" />
                 <Text className="text-slate-400 text-[10px] font-bold uppercase">Active</Text>
               </View>
               <Text className="text-slate-800 text-2xl font-black">{user?.profile?.trucks?.length || 0}</Text>
            </View>
            <View className="flex-1 bg-white p-3 rounded-2xl border border-slate-200/50 shadow-sm">
               <View className="flex-row items-center justify-between mb-2">
                 <Ionicons name="alert-circle" size={14} color="#EF4444" />
                 <Text className="text-slate-400 text-[10px] font-bold uppercase">Alerts</Text>
               </View>
               <Text className="text-slate-800 text-2xl font-black">{pendingTransfersCount}</Text>
            </View>
          </View>
        </View>

        {/* Dense Module Interface */}
        <View className="px-5 mt-6">
          {navSections.map((section, idx) => (
            <View key={idx} className="mb-6">
              <Text className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-3 ml-1">
                {section.title}
              </Text>
              
              <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {section.items.map((item, i) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => router.push(item.route as any)}
                    className={`flex-row items-center p-4 ${
                      i !== section.items.length - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    {/* Compact Professional Iconography */}
                    <View 
                      className="w-10 h-10 rounded-[10px] items-center justify-center border"
                      style={{ backgroundColor: `${item.color}15`, borderColor: `${item.color}30` }}
                    >
                      {item.icon === "truck" ? (
                        <MaterialCommunityIcons name="truck" size={18} color={item.color} />
                      ) : (
                        <Ionicons name={item.icon as any} size={18} color={item.color} />
                      )}
                    </View>
                    
                    {/* Dense Data Text */}
                    <View className="flex-1 ml-3.5 justify-center">
                      <Text className="text-slate-800 text-sm font-bold tracking-tight">{item.title}</Text>
                      <Text className="text-slate-500 text-[11px] mt-0.5 leading-tight">{item.subtitle}</Text>
                    </View>

                    {/* Unread Pill Identifiers */}
                    {item.unread > 0 && (
                      <View className="bg-rose-500 px-2.5 py-1 rounded-md mr-3 shadow-sm shadow-rose-200">
                        <Text className="text-white text-[9px] font-bold tracking-widest">{item.unread} NEW</Text>
                      </View>
                    )}

                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
