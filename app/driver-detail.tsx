import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { driverService, truckService, transferService, tripService } from "@/src/api/services";
import { Driver, Truck } from "@/src/types";

const InfoRow = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
  <View className="flex-row items-center py-3 border-b border-border/30">
    <View className="w-9 h-9 rounded-lg bg-surface items-center justify-center mr-3">
      <Ionicons name={icon as any} size={16} color={color || "#64748B"} />
    </View>
    <View className="flex-1">
      <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase">{label}</Text>
      <Text className="text-text-primary text-sm font-medium mt-0.5">{value || "—"}</Text>
    </View>
  </View>
);

const StatCard = ({ icon, label, value, bgClass, textClass }: { icon: string; label: string; value: string; bgClass: string; textClass: string }) => (
  <View className={`flex-1 rounded-xl p-3 border border-border ${bgClass}`}>
    <Ionicons name={icon as any} size={18} color="#64748B" />
    <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mt-2">{label}</Text>
    <Text className={`text-lg font-bold mt-1 ${textClass}`}>{value}</Text>
  </View>
);

export default function DriverDetailScreen() {
  const { id } = useLocalSearchParams();
  const driverId = id?.toString() || "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [truck, setTruck] = useState<Truck | null>(null);

  // Stats
  const [totalTrips, setTotalTrips] = useState(0);
  const [pendingTrips, setPendingTrips] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [pendingTransfers, setPendingTransfers] = useState(0);
  const [driverBalance, setDriverBalance] = useState<number | null>(null);

  const fetchDriverData = useCallback(async () => {
    try {
      // 1. Get driver directly from backend
      const res = await driverService.getDriverProfile(driverId);
      if (!res.driver) {
        Alert.alert("Error", "Driver not found.", [{ text: "OK", onPress: () => router.back() }]);
        return;
      }
      const found = res.driver;
      setDriver(found);

      // 2. Get truck info
      const trucksRes = await truckService.getMyTrucks();
      const foundTruck = trucksRes.trucks.find((t: any) => t.id === found.truckId);
      if (foundTruck) setTruck(foundTruck as Truck);

      // 3. Get driver stats from trips and transfers (using Promise.allSettled to avoid failures)
      const [tripsResult, transfersResult] = await Promise.allSettled([
        tripService.getTrips({ truckId: found.truckId, perpage: 1 }),
        transferService.getTransfers({ driverId: found.id, perpage: 1 }),
      ]);

      if (tripsResult.status === "fulfilled") {
        setTotalTrips(tripsResult.value.meta?.totalItems || 0);
      }

      if (transfersResult.status === "fulfilled") {
        setTotalTransfers(transfersResult.value.meta?.totalItems || 0);
      }

      // 4. Try to get pending counts
      const [pendingTripsRes, pendingTransfersRes] = await Promise.allSettled([
        tripService.getTrips({ truckId: found.truckId, perpage: 1, approved: "PENDING" as any }),
        transferService.getTransfers({ driverId: found.id, perpage: 1 }),
      ]);

      if (pendingTripsRes.status === "fulfilled") {
        setPendingTrips(pendingTripsRes.value.meta?.totalItems || 0);
      }

      if (pendingTransfersRes.status === "fulfilled") {
        // Count pending from returned transfers
        const pendingCount = pendingTransfersRes.value.transfers?.filter((t: any) => t.status === "PENDING").length || 0;
        setPendingTransfers(pendingCount);
      }

    } catch (error: any) {
      console.log("[DriverDetail] Error:", error);
      Alert.alert("Error", error.message || "Failed to load driver data.");
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDriverData();
    }, [fetchDriverData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDriverData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-text-secondary mt-3 text-sm">Loading driver profile...</Text>
      </SafeAreaView>
    );
  }

  if (!driver) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top", "bottom"]}>
        <Ionicons name="person-outline" size={48} color="#CBD5E1" />
        <Text className="text-text-secondary mt-3 text-base">Driver not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 bg-primary rounded-lg">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const licenseDate = driver.licenseRenewalDate ? new Date(driver.licenseRenewalDate) : null;
  const isLicenseExpired = licenseDate ? licenseDate < new Date() : false;
  const licenseDaysLeft = licenseDate
    ? Math.ceil((licenseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-surface">
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-lg">Driver Profile</Text>
        <TouchableOpacity
          onPress={() => {
            const qs = `?mode=edit&id=${driver.id}&name=${encodeURIComponent(driver.name)}&truckId=${encodeURIComponent(driver.truckId)}&licenseRenewalDate=${encodeURIComponent(driver.licenseRenewalDate || "")}`;
            router.push(`/manage-driver${qs}` as any);
          }}
          className="w-10 h-10 items-center justify-center rounded-full bg-primary-50 border border-primary-100"
        >
          <Ionicons name="pencil" size={16} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero */}
        <View className="items-center pt-6 pb-5 bg-white border-b border-border">
          <View className={`w-20 h-20 rounded-full items-center justify-center mb-3 border-2 ${driver.accountActive ? "bg-primary-50 border-primary-200" : "bg-danger-50 border-danger-200"}`}>
            <Ionicons name="person" size={36} color={driver.accountActive ? "#2563EB" : "#DC2626"} />
          </View>
          <Text className="text-text-primary font-bold text-2xl">{driver.name}</Text>
          <View className={`mt-2 px-3 py-1 rounded-full ${driver.accountActive ? "bg-success-50" : "bg-danger-50"}`}>
            <Text className={`text-xs font-bold uppercase tracking-wider ${driver.accountActive ? "text-success-700" : "text-danger-600"}`}>
              {driver.accountActive ? "● Active" : "● Inactive"}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-3 px-4 mt-4">
          <StatCard
            icon="swap-horizontal"
            label="Trips"
            value={totalTrips.toString()}
            bgClass="bg-white"
            textClass="text-primary"
          />
          <StatCard
            icon="cash-outline"
            label="Transfers"
            value={totalTransfers.toString()}
            bgClass="bg-white"
            textClass="text-success-700"
          />
          <StatCard
            icon="time-outline"
            label="Pending"
            value={(pendingTrips + pendingTransfers).toString()}
            bgClass="bg-amber-50"
            textClass="text-amber-700"
          />
        </View>

        {/* Vehicle Info */}
        <View className="mx-4 mt-4 bg-white rounded-2xl border border-border shadow-sm p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialCommunityIcons name="truck" size={18} color="#2563EB" />
            <Text className="text-text-primary font-bold text-sm tracking-wide">ASSIGNED VEHICLE</Text>
          </View>
          {truck ? (
            <View className="gap-0">
              <InfoRow icon="car-sport" label="Plate Number" value={truck.plateNumber} color="#2563EB" />
              {truck.vinNumber && <InfoRow icon="barcode-outline" label="VIN Number" value={truck.vinNumber} />}
              {truck.brand && <InfoRow icon="build-outline" label="Brand" value={truck.brand} />}
              {truck.model && <InfoRow icon="layers-outline" label="Model" value={truck.model} />}
            </View>
          ) : (
            <Text className="text-text-secondary text-sm">No truck assigned</Text>
          )}
        </View>

        {/* Financial Overview */}
        <View className="mx-4 mt-4 bg-white rounded-2xl border border-border shadow-sm p-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="wallet" size={18} color="#10B981" />
            <Text className="text-text-primary font-bold text-sm tracking-wide">FINANCIAL OVERVIEW</Text>
          </View>
          <View className="flex-row gap-3">
             <View className="flex-1 bg-surface p-3 rounded-xl border border-border/50">
                <Text className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Pending Balance</Text>
                <Text className="text-text-primary text-xl font-bold mt-1">${typeof driver.balance === "number" ? driver.balance.toFixed(2) : "0.00"}</Text>
             </View>
             <View className="flex-1 bg-success-50 p-3 rounded-xl border border-success-100">
                <Text className="text-success-700 text-[10px] font-bold uppercase tracking-wider">Approved Balance</Text>
                <Text className="text-success-800 text-xl font-bold mt-1">${typeof driver.approvedBalance === "number" ? driver.approvedBalance.toFixed(2) : "0.00"}</Text>
             </View>
          </View>
        </View>

        {/* License Info */}
        <View className="mx-4 mt-4 bg-white rounded-2xl border border-border shadow-sm p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="document-text" size={18} color="#7C3AED" />
            <Text className="text-text-primary font-bold text-sm tracking-wide">LICENSE</Text>
          </View>
          <InfoRow
            icon="calendar"
            label="License Renewal Date"
            value={licenseDate ? licenseDate.toISOString().split("T")[0] : "Not set"}
            color={isLicenseExpired ? "#DC2626" : "#16A34A"}
          />
          {licenseDaysLeft !== null && (
            <View className={`mt-2 px-3 py-2 rounded-lg ${isLicenseExpired ? "bg-danger-50" : licenseDaysLeft <= 30 ? "bg-amber-50" : "bg-success-50"}`}>
              <Text className={`text-xs font-bold ${isLicenseExpired ? "text-danger-600" : licenseDaysLeft <= 30 ? "text-amber-700" : "text-success-700"}`}>
                {isLicenseExpired
                  ? `⚠️ License expired ${Math.abs(licenseDaysLeft)} days ago`
                  : licenseDaysLeft <= 30
                    ? `⏳ License expires in ${licenseDaysLeft} days`
                    : `✅ License valid for ${licenseDaysLeft} days`}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mx-4 mt-4 bg-white rounded-2xl border border-border shadow-sm p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="flash" size={18} color="#2563EB" />
            <Text className="text-text-primary font-bold text-sm tracking-wide">QUICK ACTIONS</Text>
          </View>
          <View className="gap-2">
            <TouchableOpacity
              onPress={() => {
                const qs = `?mode=edit&id=${driver.id}&name=${encodeURIComponent(driver.name)}&truckId=${encodeURIComponent(driver.truckId)}&licenseRenewalDate=${encodeURIComponent(driver.licenseRenewalDate || "")}`;
                router.push(`/manage-driver${qs}` as any);
              }}
              className="flex-row items-center gap-3 bg-primary-50 rounded-xl px-4 py-3 border border-primary-100"
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={16} color="#2563EB" />
              <Text className="text-primary font-bold text-sm flex-1">Edit Profile</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(`/admin-trips?truckId=${encodeURIComponent(driver.truckId)}&truckPlate=${encodeURIComponent(truck?.plateNumber || "")}` as any)}
              className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3 border border-border"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="truck" size={16} color="#64748B" />
              <Text className="text-text-primary font-semibold text-sm flex-1">View Trips</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(`/admin-transfers?driverId=${encodeURIComponent(driver.id)}&driverName=${encodeURIComponent(driver.name)}` as any)}
              className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3 border border-border"
              activeOpacity={0.7}
            >
              <Ionicons name="swap-horizontal" size={16} color="#64748B" />
              <Text className="text-text-primary font-semibold text-sm flex-1">View Transfers</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
