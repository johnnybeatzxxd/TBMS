import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

// Dummy data for trips
const MOCK_TRIPS = [
  // Today
  { id: "1", date: getPastDateStr(0), loadingSite: "Port of Los Angeles", unloadingSite: "Amazon FC - Riverside", paymentMethod: "Dispatch" },
  { id: "2", date: getPastDateStr(0), loadingSite: "Dallas Logistics Hub", unloadingSite: "Walmart Distribution - Houston", paymentMethod: "Cash", cashAmount: "850.00" },
  { id: "3", date: getPastDateStr(0), loadingSite: "Chicago Railyard", unloadingSite: "FedEx Ground - Detroit", paymentMethod: "Dispatch" },
  
  // Yesterday
  { id: "4", date: getPastDateStr(1), loadingSite: "Miami Port", unloadingSite: "Publix DC - Orlando", paymentMethod: "Cash", cashAmount: "450.00" },
  { id: "5", date: getPastDateStr(1), loadingSite: "Newark Port Auth", unloadingSite: "Target DC - Philadelphia", paymentMethod: "Dispatch" },
  { id: "6", date: getPastDateStr(1), loadingSite: "Seattle Terminal", unloadingSite: "Costco Depot - Tacoma", paymentMethod: "Cash", cashAmount: "300.00" },

  // 2 days ago
  { id: "7", date: getPastDateStr(2), loadingSite: "Atlanta Hub", unloadingSite: "Home Depot DC - Savannah", paymentMethod: "Dispatch" },
  { id: "8", date: getPastDateStr(2), loadingSite: "Houston Port", unloadingSite: "HEB Warehouse - Austin", paymentMethod: "Cash", cashAmount: "550.00" },
  { id: "9", date: getPastDateStr(2), loadingSite: "Denver Railyard", unloadingSite: "Kroger DC - Salt Lake City", paymentMethod: "Dispatch" },
  
  // 3+ days ago
  { id: "10", date: getPastDateStr(3), loadingSite: "Oakland Port", unloadingSite: "Safeway DC - Tracy", paymentMethod: "Dispatch" },
  { id: "11", date: getPastDateStr(4), loadingSite: "Kansas City Hub", unloadingSite: "Walmart DC - Bentonville", paymentMethod: "Cash", cashAmount: "900.00" },
  { id: "12", date: getPastDateStr(5), loadingSite: "Memphis Terminal", unloadingSite: "AutoZone Hub - Little Rock", paymentMethod: "Dispatch" },
];

const getRelativeDateLabel = (dateStr: string) => {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;
  
  const d = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
  if (isNaN(d.getTime())) return "Invalid Date";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const groupedTrips = MOCK_TRIPS.reduce((acc, trip) => {
  if (!acc[trip.date]) acc[trip.date] = [];
  acc[trip.date].push(trip);
  return acc;
}, {} as Record<string, typeof MOCK_TRIPS>);

// Convert to array for rendering
const tripGroups = Object.entries(groupedTrips).map(([date, trips]) => ({
  dateStr: date,
  title: getRelativeDateLabel(date),
  data: trips,
}));

const TripCard = ({ trip }: { trip: typeof MOCK_TRIPS[0] }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm"
    >
      {/* ALWAYS VISIBLE: Unloading Site */}
      <View className="flex-row items-center justify-between p-4 bg-white">
        <View className="flex-row items-center flex-1 pr-4">
          <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center mr-3">
            <Ionicons name="location" size={20} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-0.5">
              Destination
            </Text>
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
              {trip.unloadingSite}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#94A3B8"
        />
      </View>

      {/* EXPANDED CONTENT: Date, Loading Site, Payment Method */}
      {expanded && (
        <View className="relative px-4 pb-4 bg-surface/50 border-t border-border pt-3 gap-3">
          {/* Edit icon - top right */}
          <View className="absolute top-3 right-4 z-10">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                const qs = `?id=${trip.id}&date=${encodeURIComponent(trip.date)}&loadingSite=${encodeURIComponent(trip.loadingSite)}&unloadingSite=${encodeURIComponent(trip.unloadingSite)}&paymentMethod=${trip.paymentMethod.toLowerCase()}&cashAmount=${trip.cashAmount || ""}`;
                router.push(`/add-trip${qs}` as any);
              }}
              className="w-8 h-8 bg-primary-50 rounded-lg items-center justify-center border border-primary-100"
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={14} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* Timeline Connector Graphic */}
          <View className="relative pl-2 pb-1">
            {/* Dot & Line container */}
            <View className="absolute left-4 top-2 bottom-6 w-px bg-border items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-primary-100 absolute -top-1" />
              <View className="w-2 h-2 rounded-full border border-primary bg-white absolute -bottom-1" />
            </View>

            <View className="ml-8 gap-4">
              <View>
                <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                  Loading Site
                </Text>
                <Text className="text-text-primary text-sm font-medium mt-0.5">
                  {trip.loadingSite}
                </Text>
              </View>

              <View>
                <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                  Trip Date
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Ionicons name="calendar-outline" size={12} color="#64748B" />
                  <Text className="text-text-primary text-sm font-medium ml-1">
                    {trip.date}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Method Badge */}
          <View className="flex-row items-center justify-between mt-1 pt-3 border-t border-border/50">
            <View className="flex-row items-center">
              <Text className="text-text-secondary text-xs uppercase font-medium tracking-wider mr-2">
                Payment
              </Text>
              <View
                className={`px-2.5 py-1 rounded-md ${
                  trip.paymentMethod === "Cash" ? "bg-success-50" : "bg-primary-50"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    trip.paymentMethod === "Cash" ? "text-success-600" : "text-primary-600"
                  }`}
                >
                  {trip.paymentMethod}
                </Text>
              </View>
            </View>

            {trip.paymentMethod === "Cash" && trip.cashAmount && (
              <View className="flex-row items-center">
                <Text className="text-text-secondary text-xs uppercase font-medium tracking-wider mr-1">
                  Amount:
                </Text>
                <Text className="text-success-700 font-bold text-sm">
                  ${trip.cashAmount}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function TripsListScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row items-center px-5 pt-2 pb-3 border-b border-border shadow-sm z-10 bg-white">
        <MaterialCommunityIcons name="truck" size={26} color="#2563EB" className="mr-2" />
        <Text className="text-text-primary font-bold text-xl ml-2 tracking-wide">Trips</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {tripGroups.map((group) => (
          <View key={group.dateStr} className="mb-6">
            <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1">
              {group.title}
            </Text>
            {group.data.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Floating Action Button (Alternative Add Button) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/add-trip")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg border border-primary-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
