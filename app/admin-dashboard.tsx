import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { tripService, transferService } from "@/src/api/services";

export default function AdminDashboardScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const [pendingTripsCount, setPendingTripsCount] = useState(0);
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);

  // Dynamically calculate KPIs simply by grabbing first pages and aggregating locally
  useFocusEffect(
    useCallback(() => {
      const fetchLocalKPIs = async () => {
        try {
          const [tripsRes, transfersRes] = await Promise.allSettled([
            tripService.getTrips({ page: 1, paymentMethod: "CASH" }),
            transferService.getTransfers({ page: 1 })
          ]);
          
          if (tripsRes.status === "fulfilled") {
            const pendingTrips = tripsRes.value.data.filter((t: any) => t.approved !== "APPROVED");
            setPendingTripsCount(pendingTrips.length);
          }

          if (transfersRes.status === "fulfilled") {
            const pendingTransfers = transfersRes.value.transfers.filter((t: any) => t.status === "PENDING");
            setPendingTransfersCount(pendingTransfers.length);
          }
        } catch (e) {
          console.log("[Dashboard] Failed fetching modular KPIs locally:", e);
        }
      };
      fetchLocalKPIs();
    }, [])
  );

  const totalActionable = pendingTripsCount + pendingTransfersCount;

  const navSections = [
    {
      title: "Operations",
      items: [
        { id: "trips", title: "Trip Management", subtitle: "Review and approve driver logs", icon: "truck", route: "/admin-trips", color: "#3B82F6", unread: pendingTripsCount },
        { id: "requests", title: "Service Requests", subtitle: "Manage fleet maintenance", icon: "document-text", route: "/admin-requests", color: "#10B981", unread: 0 },
        { id: "refuels", title: "Fleet Refuels", subtitle: "Fuel consumption logs", icon: "water", route: "/admin-refuels", color: "#0EA5E9", unread: 0 },
      ]
    },
    {
      title: "Finance",
      items: [
        { id: "expenses", title: "Driver Expenses", subtitle: "Road and operational spendings", icon: "receipt", route: "/admin-expenses", color: "#EF4444", unread: 0 },
        { id: "transfers", title: "Money Transfers", subtitle: "Internal fleet balancing", icon: "swap-horizontal", route: "/admin-transfers", color: "#F59E0B", unread: pendingTransfersCount },
      ]
    },
    {
      title: "Administration",
      items: [
        { id: "manage", title: "System Configuration", subtitle: "Drivers, Trucks & Companies", icon: "settings", route: "/admin-manage", color: "#64748B", unread: 0 },
        { id: "analytics", title: "Reports & Analytics", subtitle: "Export CSV and view fleet trends", icon: "bar-chart", route: "/admin-analytics", color: "#8B5CF6", unread: 0 },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["top","bottom"]}>
      <StatusBar style="light" />
      {/* Enterprise Header Banner */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4 bg-slate-900" style={{ zIndex: 10 }}>
        <TouchableOpacity 
          className="flex-row items-center gap-3 flex-1"
          activeOpacity={0.8}
          onPress={() => router.push("/profile")}
        >
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
        </TouchableOpacity>

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
          <Text className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-3">Today's Overview</Text>
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
