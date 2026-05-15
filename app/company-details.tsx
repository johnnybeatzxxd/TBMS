import { useEffect, useState, useCallback, useMemo } from "react";
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
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Company, Truck, TruckCompanyBalance } from "@/src/types";
import { companyService, truckService } from "@/src/api/services";
import { useAuthStore } from "@/src/store";

export default function CompanyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string; name?: string }>();

  const [company, setCompany] = useState<Company | null>(null);
  const [allTrucks, setAllTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showTruckPicker, setShowTruckPicker] = useState(false);
  const [financialTruckId, setFinancialTruckId] = useState<string>("");
  const [showFinancialTruckMenu, setShowFinancialTruckMenu] = useState(false);
  const [truckScopedBalance, setTruckScopedBalance] = useState<TruckCompanyBalance | null>(null);
  const [truckScopeLoading, setTruckScopeLoading] = useState(false);

  useEffect(() => {
    setFinancialTruckId("");
    setShowFinancialTruckMenu(false);
    setTruckScopedBalance(null);
    setTruckScopeLoading(false);
  }, [id]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [co, trucksRes] = await Promise.all([
        companyService.getCompanyById(String(id)),
        truckService.getMyTrucks(),
      ]);
      setCompany(co);
      setAllTrucks(trucksRes.trucks || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (!useAuthStore.getState().isAuthenticated) return;
      if (id) void fetchData();
    }, [id, fetchData])
  );

  useEffect(() => {
    if (!company?.id || !financialTruckId) {
      setTruckScopedBalance(null);
      setTruckScopeLoading(false);
      return;
    }
    let cancelled = false;
    setTruckScopeLoading(true);
    setTruckScopedBalance(null);
    companyService
      .getTruckCompanyInfo(financialTruckId, company.id)
      .then((b) => {
        if (!cancelled) setTruckScopedBalance(b);
      })
      .catch((err: any) => {
        if (!cancelled) {
          Alert.alert("Error", err?.message || "Failed to load truck balance");
          setTruckScopedBalance(null);
        }
      })
      .finally(() => {
        if (!cancelled) setTruckScopeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [financialTruckId, company]);

  // Trucks assigned to this company
  const assignedTruckIds = new Set(
    (company?.allowedTrucks || []).map((t: any) => t.truckId || t.id || t)
  );

  // Trucks that can be added (not yet assigned to this company)
  const availableTrucks = allTrucks.filter((t) => !assignedTruckIds.has(t.id));

  // Truck objects that ARE assigned
  const assignedTrucks = allTrucks.filter((t) => assignedTruckIds.has(t.id));

  const financialLabel = useMemo(() => {
    if (!financialTruckId) return "All trucks";
    return assignedTrucks.find((t) => t.id === financialTruckId)?.plateNumber || "Truck";
  }, [financialTruckId, assignedTrucks]);

  const overviewBalances = useMemo(() => {
    if (!company) return { current: 0, total: 0 };
    if (!financialTruckId) {
      return {
        current: company.currentBalance,
        total: company.totalBalance || company.currentBalance,
      };
    }
    if (truckScopedBalance) {
      return {
        current: truckScopedBalance.currentBalance,
        total: truckScopedBalance.totalBalance,
      };
    }
    return { current: 0, total: 0 };
  }, [company, financialTruckId, truckScopedBalance]);

  const handleAddTruck = async (truckId: string) => {
    if (!id) return;
    setActionLoading(truckId);
    try {
      await companyService.addTruckToCompany(id, truckId);
      await fetchData();
      setShowTruckPicker(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to assign truck");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveTruck = (truck: Truck) => {
    if (!id) return;
    Alert.alert(
      "Remove Truck",
      `Remove ${truck.plateNumber} from ${company?.name || "this company"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setActionLoading(truck.id);
            try {
              await companyService.removeTruckFromCompany(id, truck.id);
              await fetchData();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to remove truck");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top","bottom"]}>
        <ActivityIndicator size="large" color="#D97706" />
      </SafeAreaView>
    );
  }

  if (!company) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8" edges={["top","bottom"]}>
        <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
        <Text className="text-text-secondary font-medium mt-4 text-center">Company not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-3 bg-primary rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-text-primary font-bold text-xl tracking-tight" numberOfLines={1}>
            {company.name}
          </Text>
          <Text className="text-text-secondary text-xs">Company Details</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* Balance Card */}
        <View className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-border bg-amber-50">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Ionicons name="wallet-outline" size={16} color="#D97706" />
              <Text className="text-amber-700 font-semibold text-xs tracking-widest uppercase">
                Financial Overview
              </Text>
            </View>
            <View className="relative" style={{ zIndex: 20, elevation: 12 }}>
              <TouchableOpacity
                onPress={() => setShowFinancialTruckMenu((v) => !v)}
                className="flex-row items-center gap-1 bg-white/90 border border-amber-200 rounded-xl px-2.5 py-1.5 max-w-[140px]"
                activeOpacity={0.85}
              >
                <Ionicons name="car-sport" size={14} color="#D97706" />
                <Text className="text-amber-900 font-semibold text-xs flex-1" numberOfLines={1}>
                  {financialLabel}
                </Text>
                <Ionicons name={showFinancialTruckMenu ? "chevron-up" : "chevron-down"} size={14} color="#92400E" />
              </TouchableOpacity>

              {showFinancialTruckMenu && (
                <View className="absolute right-0 top-9 bg-white rounded-xl border border-border shadow-lg overflow-hidden min-w-[160px] max-h-56">
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    <TouchableOpacity
                      onPress={() => {
                        setFinancialTruckId("");
                        setShowFinancialTruckMenu(false);
                      }}
                      className={`px-3 py-2.5 flex-row items-center gap-2 border-b border-border ${
                        financialTruckId === "" ? "bg-amber-50" : ""
                      }`}
                    >
                      <Ionicons
                        name="apps-outline"
                        size={16}
                        color={financialTruckId === "" ? "#D97706" : "#64748B"}
                      />
                      <Text
                        className={`text-sm font-medium flex-1 ${
                          financialTruckId === "" ? "text-amber-800 font-bold" : "text-text-primary"
                        }`}
                      >
                        All trucks
                      </Text>
                      {financialTruckId === "" ? (
                        <Ionicons name="checkmark" size={14} color="#D97706" />
                      ) : null}
                    </TouchableOpacity>
                    {assignedTrucks.map((truck) => (
                      <TouchableOpacity
                        key={truck.id}
                        onPress={() => {
                          setFinancialTruckId(truck.id);
                          setShowFinancialTruckMenu(false);
                        }}
                        className={`px-3 py-2.5 flex-row items-center gap-2 border-b border-border ${
                          financialTruckId === truck.id ? "bg-amber-50" : ""
                        }`}
                      >
                        <MaterialCommunityIcons
                          name="truck-outline"
                          size={16}
                          color={financialTruckId === truck.id ? "#D97706" : "#64748B"}
                        />
                        <Text
                          className={`text-sm font-medium flex-1 ${
                            financialTruckId === truck.id ? "text-amber-800 font-bold" : "text-text-primary"
                          }`}
                          numberOfLines={1}
                        >
                          {truck.plateNumber}
                        </Text>
                        {financialTruckId === truck.id ? (
                          <Ionicons name="checkmark" size={14} color="#D97706" />
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
          <View className="p-4 flex-row gap-4">
            <View className="flex-1 items-center">
              <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                Current Balance
              </Text>
              {truckScopeLoading && financialTruckId ? (
                <View className="h-8 justify-center mt-1">
                  <ActivityIndicator size="small" color="#D97706" />
                </View>
              ) : (
                <Text
                  className={`font-bold text-2xl ${
                    overviewBalances.current > 0 ? "text-amber-600" : "text-success"
                  }`}
                >
                  ${overviewBalances.current.toLocaleString()}
                </Text>
              )}
            </View>
            <View className="w-px bg-border" />
            <View className="flex-1 items-center">
              <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                Total Balance
              </Text>
              {truckScopeLoading && financialTruckId ? (
                <View className="h-8 justify-center mt-1">
                  <ActivityIndicator size="small" color="#64748B" />
                </View>
              ) : (
                <Text className="text-text-secondary font-bold text-2xl">
                  ${overviewBalances.total.toLocaleString()}
                </Text>
              )}
            </View>
          </View>

        <View className="px-4 pb-4 flex-row gap-3">
          <TouchableOpacity
            disabled={truckScopeLoading && !!financialTruckId}
            onPress={() => {
              const assignedPayload = assignedTrucks.map((t) => ({
                id: t.id,
                plateNumber: t.plateNumber,
              }));
              const navParams: Record<string, string> = {
                companyId: company.id,
                name: company.name,
                currentBalance: String(Math.round(overviewBalances.current)),
                assignedTrucks: JSON.stringify(assignedPayload),
              };
              if (financialTruckId) {
                navParams.presetTruckId = financialTruckId;
                navParams.presetTruckPlate =
                  assignedTrucks.find((t) => t.id === financialTruckId)?.plateNumber || "Truck";
              }
              router.push({
                pathname: "/company-trips",
                params: navParams,
              } as any);
            }}
            className={`flex-1 flex-row items-center justify-center gap-2 bg-primary-50 border border-primary-100 py-3 rounded-xl ${
              truckScopeLoading && financialTruckId ? "opacity-50" : ""
            }`}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#2563EB" />
            <Text className="text-primary font-bold text-sm">Claim Trips</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/company-payments?companyId=${company.id}&name=${encodeURIComponent(company.name)}` as any
              )
            }
            className="flex-1 flex-row items-center justify-center gap-2 bg-success-50 border border-success-200 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Ionicons name="cash-outline" size={16} color="#16A34A" />
            <Text className="text-success-700 font-bold text-sm">Payments</Text>
          </TouchableOpacity>
        </View>
        </View>

        {/* Assigned Trucks */}
        <View className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-border bg-sky-50">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="truck-outline" size={16} color="#0EA5E9" />
              <Text className="text-sky-700 font-semibold text-xs tracking-widest uppercase">
                Assigned Trucks
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowTruckPicker(!showTruckPicker)}
              className="flex-row items-center gap-1 px-3 py-1.5 bg-sky-500 rounded-full"
              activeOpacity={0.8}
            >
              <Ionicons name={showTruckPicker ? "close" : "add"} size={14} color="#fff" />
              <Text className="text-white text-xs font-bold">
                {showTruckPicker ? "Cancel" : "Add Truck"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Truck Picker Dropdown */}
          {showTruckPicker && (
            <View className="border-b border-border bg-sky-50/50 px-4 py-3">
              {availableTrucks.length === 0 ? (
                <Text className="text-text-secondary text-sm text-center py-2">
                  All your trucks are already assigned to this company.
                </Text>
              ) : (
                <View className="gap-2">
                  <Text className="text-text-secondary text-xs font-semibold mb-1">
                    Select a truck to assign:
                  </Text>
                  {availableTrucks.map((truck) => (
                    <TouchableOpacity
                      key={truck.id}
                      onPress={() => handleAddTruck(truck.id)}
                      disabled={actionLoading === truck.id}
                      className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-border"
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="truck-outline" size={20} color="#0EA5E9" />
                      <Text className="flex-1 ml-3 text-text-primary font-medium text-sm">
                        {truck.plateNumber}
                        {truck.vinNumber ? ` — ${truck.vinNumber}` : ""}
                      </Text>
                      {actionLoading === truck.id ? (
                        <ActivityIndicator size="small" color="#0EA5E9" />
                      ) : (
                        <Ionicons name="add-circle" size={22} color="#0EA5E9" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Assigned Truck List */}
          <View className="p-4 gap-3">
            {assignedTrucks.length === 0 ? (
              <View className="items-center py-6">
                <MaterialCommunityIcons name="truck-remove-outline" size={36} color="#CBD5E1" />
                <Text className="text-text-secondary text-sm mt-2 text-center">
                  No trucks assigned yet.{"\n"}Tap "Add Truck" above to link one.
                </Text>
              </View>
            ) : (
              assignedTrucks.map((truck) => (
                <View
                  key={truck.id}
                  className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-border"
                >
                  <View className="w-10 h-10 bg-sky-50 rounded-full items-center justify-center mr-3 border border-sky-100">
                    <MaterialCommunityIcons name="truck" size={20} color="#0EA5E9" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-bold text-sm">{truck.plateNumber}</Text>
                    {truck.vinNumber && (
                      <Text className="text-text-secondary text-xs mt-0.5">VIN: {truck.vinNumber}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveTruck(truck)}
                    disabled={actionLoading === truck.id}
                    className="w-9 h-9 items-center justify-center rounded-full bg-red-50 border border-red-100"
                  >
                    {actionLoading === truck.id ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <Ionicons name="remove-circle-outline" size={18} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
