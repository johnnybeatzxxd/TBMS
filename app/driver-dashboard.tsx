import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Modal, BackHandler, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { reminderService, displayService } from "@/src/api/services";
import { Reminder } from "@/src/types/reminder.types";
import { notificationUtils } from "@/src/utils/notifications";

const TIPS = [
  "Drive Safe and take regular breaks!",
  "Pay attention to detail when logging routes!",
  "Always confirm the Unloading Destination!",
  "Make sure to securely park the truck!"
];

const AnimatedTips = ({ tips = TIPS }: { tips?: string[] }) => {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Safe default fallback incase of empty array passed during transition
  const safeTips = tips.length > 0 ? tips : TIPS;

  useEffect(() => {
    // Reset index on tip change
    setIndex(0);
  }, [tips]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -15,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIndex((prev) => (prev + 1) % safeTips.length);
        translateY.setValue(15);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          })
        ]).start();
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [safeTips.length]);

  return (
    <View className="h-10 justify-center items-center w-full px-2">
      <Animated.Text
        style={{
          opacity: fadeAnim,
          transform: [{ translateY }],
        }}
        className="text-text-primary text-xl font-black tracking-tight text-center"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {safeTips[index] || safeTips[0]}
      </Animated.Text>
    </View>
  );
};

export default function DriverDashboardScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const [pendingReminders, setPendingReminders] = useState<Reminder[]>([]);
  const [dynamicTips, setDynamicTips] = useState<string[]>(TIPS);
   const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    notificationUtils.setupPushNotificationsAsync();
  }, []);

  // Redirect if wrong role somehow landed here
  useEffect(() => {
    if (user && user.role !== 'driver') {
      router.replace('/admin-dashboard');
    }
  }, [user]);

  // Trap hardware back button — dashboard is a root; back should exit app, not navigate
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });
      return () => subscription.remove();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      Promise.allSettled([
        reminderService.getPendingRemindersDriver(),
        displayService.getRollingDisplays()
      ]).then(([remRes, dispRes]) => {
        if (remRes.status === "fulfilled") {
          const pending = remRes.value.pending || [];
          setPendingReminders(pending);
          
          notificationUtils.processNewAlerts(
            pending,
            (item) => item._id || item.id,
            (item) => ({ title: item.reminderName, body: item.reminderMessage })
          );
        }
        
        if (dispRes.status === "fulfilled" && dispRes.value.displays?.length > 0) {
          setDynamicTips(dispRes.value.displays.map((d: any) => d.displayMessage));
        } else {
          setDynamicTips(TIPS);
        }
      });
    }, [])
  );

  const actionButtons = [
    {
      id: "trip",
      title: "Trip",
      icon: "road-variant",
      color: "#2563EB",
      bgColor: "#DBEAFE",
      route: "/driver-trips",
    },
    {
      id: "expense",
      title: "Expense",
      icon: "cash-multiple",
      color: "#DC2626",
      bgColor: "#FEE2E2",
      route: "/driver-expenses",
    },
    {
      id: "refuel",
      title: "Refuel",
      icon: "gas-station",
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      route: "/driver-refuels",
    },
    {
      id: "transfer",
      title: "Transfer",
      icon: "bank-transfer",
      color: "#16A34A",
      bgColor: "#DCFCE7",
      route: "/driver-transfers",
    },
    {
      id: "requests",
      title: "Requests",
      icon: "clipboard-text-outline",
      color: "#8B5CF6",
      bgColor: "#EDE9FE",
      route: "/admin-requests",
    },
    {
      id: "perdiem",
      title: "Perdiem",
      icon: "calendar-clock",
      color: "#0EA5E9",
      bgColor: "#E0F2FE",
      route: "/add-perdiem",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-6 bg-white border-b border-border shadow-sm rounded-b-3xl elevation-10 z-50">
        <TouchableOpacity 
          className="flex-row items-center gap-3 flex-1" 
          activeOpacity={0.7}
          onPress={() => router.push("/profile")}
        >
          <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center border-2 border-primary-200">
            <Ionicons name="person" size={24} color="#2563EB" />
          </View>
          <View>
            <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">
              Welcome Back
            </Text>
            <Text className="text-text-primary text-xl font-bold">
              {user?.name || "Driver"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/driver-notifications")}
          className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center border border-slate-200 relative"
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color="#64748B" />
          {pendingReminders.length > 0 && (
            <View className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full items-center justify-center border-2 border-white">
              <Text className="text-white text-[8px] font-bold">{pendingReminders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-10 gap-2">
           <AnimatedTips tips={dynamicTips} />
           <Text className="text-text-secondary text-base text-center max-w-xs">
             Tap a box below to quickly submit your records.
           </Text>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-6">
          {actionButtons.map((btn) => (
            <TouchableOpacity
              key={btn.id}
              activeOpacity={0.85}
              onPress={() => router.push(btn.route as any)}
              className="bg-white rounded-[32px] border border-border shadow-md items-center justify-center p-6 elevation-5"
              style={{ width: "47%", aspectRatio: 1 }}
            >
              <View
                className="w-20 h-20 rounded-[24px] items-center justify-center mb-4 shadow-sm"
                style={{ backgroundColor: btn.bgColor }}
              >
                <MaterialCommunityIcons name={btn.icon as any} size={48} color={btn.color} />
              </View>
              <Text className="text-text-primary font-black text-xl tracking-wide">
                {btn.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>



    </SafeAreaView>
  );
}
