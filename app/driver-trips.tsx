import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { tripService } from "@/src/api/services";
import { Trip } from "@/src/types";

// Helper to format date string for display grouping
const formatDateGroup = (dateString: string) => {
  const d = new Date(dateString);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

const getGroupedTrips = (trips: Trip[]) => {
  const grouped = trips.reduce((acc, trip) => {
    const formattedDate = formatDateGroup(trip.date);
    if (!acc[formattedDate]) acc[formattedDate] = [];
    acc[formattedDate].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  // Sorting descending by date string assumes chronological order, typically standard string sort is fine or just relying on API order
  return Object.entries(grouped).map(([date, t]) => ({
    title: date,
    data: t,
  }));
};

const TripCard = ({ trip }: { trip: Trip }) => {
  return (
    <View className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm p-4">
      <View className="flex-row justify-between mb-3">
        <View>
          <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Route</Text>
          <Text className="text-text-primary font-bold text-base">{trip.loadingSite} - {trip.destinationSite}</Text>
        </View>
        {trip.paymentMethod === "CASH" && trip.approved ? (
          <View style={[styles.statusBadge, 
            trip.approved === "APPROVED" ? styles.statusApproved : 
            trip.approved === "DECLINED" ? styles.statusDeclined : 
            styles.statusPending]}>
            <Text style={[styles.statusText,
              trip.approved === "APPROVED" ? styles.statusTextApproved : 
              trip.approved === "DECLINED" ? styles.statusTextDeclined : 
              styles.statusTextPending
            ]}>{trip.approved}</Text>
          </View>
        ) : (
          <Ionicons name="location" size={20} color="#2563EB" />
        )}
      </View>
      <View className="flex-row justify-between pt-3 border-t border-border/50">
        <View>
          <Text className="text-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1">Volume</Text>
          <Text className="text-text-primary text-sm font-semibold">{trip.volume?.replace("MCUBE", " M³")}</Text>
        </View>
        <View className="items-end">
          <Text className="text-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1">Payment</Text>
          <View style={[styles.badge, trip.paymentMethod === "CASH" ? styles.cashBadge : styles.creditBadge]}>
             <Text style={[styles.badgeText, trip.paymentMethod === "CASH" ? styles.cashText : styles.creditText]}>
               {trip.paymentMethod} {trip.amount ? `$${trip.amount}` : ""}
             </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function DriverTripsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tripType, setTripType] = useState<"Cash" | "Credit">("Cash");

  const fetchTrips = useCallback(async (pageNum: number, type: "Cash" | "Credit", append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await tripService.getTrips({
        page: pageNum,
        perpage: 10,
        paymentMethod: type.toUpperCase() as "CASH" | "CREDIT",
      });

      setTrips(prev => append ? [...prev, ...response.data] : response.data);
      setPage(response.meta.currentPage);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load trips.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips(1, tripType, false);
  }, [tripType, fetchTrips]);

  const loadMoreData = () => {
    if (loadingMore || loading || page >= totalPages) return;
    fetchTrips(page + 1, tripType, true);
  };

  const tripGroups = getGroupedTrips(trips);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm" style={{ zIndex: 50 }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3 border border-border">
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="road-variant" size={26} color="#2563EB" />
        <Text className="text-text-primary font-bold text-xl ml-2">My Trips</Text>
      </View>

      {/* Cash / Credit Switch */}
      <View style={styles.switchContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setTripType("Cash")}
          style={[styles.switchTab, tripType === "Cash" && styles.switchTabActive]}
        >
          <Text style={[styles.switchText, tripType === "Cash" && { color: "#16A34A" }]}>
            💵  Cash
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setTripType("Credit")}
          style={[styles.switchTab, tripType === "Credit" && styles.switchTabActive]}
        >
          <Text style={[styles.switchText, tripType === "Credit" && { color: "#2563EB" }]}>
            🧾  Credit
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <SectionList
          sections={tripGroups}
          keyExtractor={(item, index) => item.id + index}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase ml-1 mb-1 mt-6">
              {title}
            </Text>
          )}
          renderItem={({ item }) => <TripCard trip={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center">
               <Text className="text-text-secondary font-medium">No {tripType.toLowerCase()} trips logged yet.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : <View className="h-4" />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/add-trip?tripType=${tripType.toLowerCase()}` as any)}
        style={styles.fab}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 4,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  switchTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  switchTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  switchText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#94A3B8",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cashBadge: { backgroundColor: "#F0FDF4" },
  creditBadge: { backgroundColor: "#EFF6FF" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  cashText: { color: "#16A34A" },
  creditText: { color: "#2563EB" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  statusApproved: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  statusDeclined: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  statusPending: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  statusTextApproved: { color: "#16A34A" },
  statusTextDeclined: { color: "#DC2626" },
  statusTextPending: { color: "#D97706" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: "#2563EB",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#1D4ED8",
  },
});
