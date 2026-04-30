import { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Company } from "@/src/types";
import { companyService } from "@/src/api/services";

export default function CompaniesListScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await companyService.getCompanies();
      setCompanies(res || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  // Refetch when screen comes back into focus (e.g. after adding a company or editing trucks)
  useFocusEffect(
    useCallback(() => {
      fetchCompanies();
    }, [])
  );

  const displayCompanies = useMemo(() => {
    if (!searchQuery) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-2xl tracking-tight">Companies</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-2 border border-border">
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-2 text-text-primary text-sm py-1.5"
            placeholder="Search companies by name..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D97706" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {displayCompanies.length === 0 ? (
            <View className="items-center py-10">
              <Ionicons name="business-outline" size={48} color="#CBD5E1" />
              <Text className="text-text-secondary font-medium mt-4 text-center">
                {companies.length === 0
                  ? "You have no contracted companies.\nTap the + button to register one."
                  : "No companies match your search."}
              </Text>
            </View>
          ) : (
            displayCompanies.map((company) => {
              const truckCount = company.allowedTrucks?.length || 0;
              return (
                <TouchableOpacity
                  key={company.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(`/company-details?id=${company.id}&name=${encodeURIComponent(company.name)}` as any)
                  }
                  className="bg-white rounded-2xl border border-border shadow-sm p-4"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center flex-1 pr-4">
                      <View className="w-12 h-12 bg-amber-50 rounded-full items-center justify-center mr-3 border border-amber-100">
                        <Ionicons name="business" size={22} color="#D97706" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-text-primary font-bold text-lg" numberOfLines={1}>
                          {company.name}
                        </Text>
                        <Text className="text-text-secondary text-xs mt-0.5">
                          {truckCount} truck{truckCount !== 1 ? "s" : ""} assigned
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                  </View>

                  {/* Balances */}
                  <View className="bg-surface rounded-xl p-3 border border-border flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                        Current Debt
                      </Text>
                      <Text className={`font-bold text-base ${company.currentBalance > 0 ? "text-amber-600" : "text-text-primary"}`}>
                        ${company.currentBalance.toLocaleString()}
                      </Text>
                    </View>
                    <View className="w-px bg-border my-1" />
                    <View className="flex-1">
                      <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">
                        Total Debt
                      </Text>
                      <Text className="text-text-secondary font-bold text-base">
                        ${(company.totalBalance || company.currentBalance).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* FAB - Add Company */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => router.push("/add-company" as any)}
          className="bg-amber-500 w-14 h-14 rounded-full items-center justify-center shadow-md shadow-amber-500"
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
