import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { tripService, companyService } from "@/src/api/services";
import { Company, AddTripPayload, UpdateTripPayload } from "@/src/types";
import { useCachedFetch } from "@/src/hooks/useCachedFetch";
import { useAuthStore } from "@/src/store";

type Volume = "10MCUBE" | "16MCUBE";

export default function AddTripModal() {
  const user = useAuthStore((s) => s.user);

  const params = useLocalSearchParams<{
    id?: string;
    tripType?: string;
    date?: string;
    loadingSite?: string;
    unloadingSite?: string;
    paymentMethod?: string;
    cashAmount?: string;
    volume?: string;
    roadExpense?: string;
  }>();

  const isEditMode = !!params.id;

  // Parse date from params (MM/DD/YYYY) or use today
  const parseDate = (dateStr?: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
    }
    return new Date();
  };

  const tripType: "cash" | "credit" =
    params.tripType?.toLowerCase() === "credit" || 
    params.paymentMethod?.toLowerCase() === "dispatch" || 
    params.paymentMethod?.toLowerCase() === "credit"
      ? "credit"
      : "cash";

  const [tripDate, setTripDate] = useState(parseDate(params.date));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loadingSite, setLoadingSite] = useState(params.loadingSite || "");
  const [unloadingSite, setUnloadingSite] = useState(params.unloadingSite || "");
  const [volume, setVolume] = useState<Volume>((params.volume as Volume) || "10MCUBE");

  const [cashAmount, setCashAmount] = useState(params.cashAmount || "");
  const [paymentAmount, setPaymentAmount] = useState(params.cashAmount || "");
  const [roadExpense, setRoadExpense] = useState(params.roadExpense || "");

  // Auto-complete logic
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<string[]>([]);
  const [unloadingSuggestions, setUnloadingSuggestions] = useState<string[]>([]);
  const [showLoadingSuggestions, setShowLoadingSuggestions] = useState(false);
  const [showUnloadingSuggestions, setShowUnloadingSuggestions] = useState(false);

  useEffect(() => {
    if (user?.id) {
      AsyncStorage.getItem(`@locations_${user.id}`).then(val => {
        if (val) setSavedLocations(JSON.parse(val));
      }).catch(() => {});
    }
  }, [user?.id]);

  const saveNewLocations = async (loc1: string, loc2: string) => {
    if (!user?.id) return;
    let updated = [...savedLocations];
    let changed = false;
    
    if (loc1 && !updated.includes(loc1)) { updated.push(loc1); changed = true; }
    if (loc2 && !updated.includes(loc2)) { updated.push(loc2); changed = true; }

    if (changed) {
      setSavedLocations(updated);
      await AsyncStorage.setItem(`@locations_${user.id}`, JSON.stringify(updated)).catch(() => {});
    }
  };

  const handleLoadingSiteChange = (text: string) => {
    setLoadingSite(text);
    if (text.length >= 1) {
      const filtered = savedLocations.filter(loc => loc.toLowerCase().startsWith(text.toLowerCase()) && loc !== text);
      setLoadingSuggestions(filtered);
      setShowLoadingSuggestions(filtered.length > 0);
    } else {
      setShowLoadingSuggestions(false);
    }
  };

  const handleUnloadingSiteChange = (text: string) => {
    setUnloadingSite(text);
    if (text.length >= 1) {
      const filtered = savedLocations.filter(loc => loc.toLowerCase().startsWith(text.toLowerCase()) && loc !== text);
      setUnloadingSuggestions(filtered);
      setShowUnloadingSuggestions(filtered.length > 0);
    } else {
      setShowUnloadingSuggestions(false);
    }
  };


  // Use the cached fetch hook to aggressively load allowed companies in case we need them
  const { data: companies, isLoading: isLoadingCompanies } = useCachedFetch<{ id: string, name: string }[]>(
    "ALLOWED_COMPANIES",
    tripService.getAllowedCompanies,
    []
  );

  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setTripDate(selected);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

  const handleSubmit = async () => {
    if (!loadingSite.trim() || !unloadingSite.trim()) {
      Alert.alert("Validation Error", "Please fill in both loading and unloading sites.");
      return;
    }
    if (tripType === "cash" && (!cashAmount || isNaN(Number(cashAmount)))) {
      Alert.alert("Validation Error", "Please enter a valid cash amount.");
      return;
    }
    if (tripType === "credit" && !isEditMode) {
      if (!selectedCompany) {
        Alert.alert("Validation Error", "Please select a company.");
        return;
      }
    }
    if (roadExpense && isNaN(Number(roadExpense))) {
      Alert.alert("Validation Error", "Please enter a valid road expense amount.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: AddTripPayload = {
        date: tripDate,
        loadingSite: loadingSite.trim(),
        destinationSite: unloadingSite.trim(),
        volume: volume === "10MCUBE" ? "MCUBE10" : "MCUBE16",
        paymentMethod: tripType === "cash" ? "CASH" : "CREDIT",
        amount: tripType === "cash" ? Number(cashAmount) : Number(paymentAmount),
        roadExpence: roadExpense ? Number(roadExpense) : 0,
        companyId: tripType === "credit" ? selectedCompany : undefined,
        receiptPic: tripType === "credit" ? "-" : undefined,
      };

      if (isEditMode && params.id) {
        const updatePayload: UpdateTripPayload = {
          date: payload.date,
          loadingSite: payload.loadingSite,
          destinationSite: payload.destinationSite,
          volume: payload.volume,
          paymentMethod: payload.paymentMethod,
          amount: payload.amount,
          roadExpence: payload.roadExpence,
        };
        await tripService.updateTrip(params.id, updatePayload);
      } else {
        await tripService.addTrip(payload);
      }

      await saveNewLocations(payload.loadingSite, payload.destinationSite);

      Alert.alert(
        "Success",
        isEditMode ? "Trip updated successfully!" : "Trip logged successfully!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Submission Failed", error.message || "Failed to process the trip.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Modal Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white border-b border-border shadow-sm">
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
          <Ionicons name="chevron-back" size={28} color="#2563EB" />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-lg tracking-wide">
          {isEditMode ? "Edit Trip" : tripType === "cash" ? "New Cash Trip" : "New Credit Trip"}
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Date */}
        <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <View className="px-4 pt-4 pb-4">
            <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
              Trip Date *
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3.5 border border-border"
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color="#2563EB" />
              <Text className="text-text-primary font-medium flex-1">
                {formatDate(tripDate)}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={tripDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}
        </View>

        {/* Volume Selection */}
        <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <View className="flex-row items-center gap-2 px-4 pt-4 pb-3 border-b border-border bg-primary-50">
            <Ionicons name="cube-outline" size={16} color="#2563EB" />
            <Text className="text-primary font-semibold text-xs tracking-widest uppercase">
              Volume (M³)
            </Text>
          </View>
          <View className="p-4">
            <View className="flex-row bg-surface rounded-xl overflow-hidden border border-border">
              <TouchableOpacity
                onPress={() => setVolume("10MCUBE")}
                className={`flex-1 py-3 items-center rounded-xl ${volume === "10MCUBE" ? "bg-primary-700" : "bg-transparent"
                  }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-bold text-sm tracking-widest uppercase ${volume === "10MCUBE" ? "text-white" : "text-text-secondary"
                    }`}
                >
                  10M³
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setVolume("16MCUBE")}
                className={`flex-1 py-3 items-center rounded-xl ${volume === "16MCUBE" ? "bg-primary-700" : "bg-transparent"
                  }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-bold text-sm tracking-widest uppercase ${volume === "16MCUBE" ? "text-white" : "text-text-secondary"
                    }`}
                >
                  16M³
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Company Dropdown (Credit Only, hidden in edit mode) */}
        {tripType === "credit" && !isEditMode && (
          <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <View className="flex-row items-center gap-2 px-4 pt-4 pb-3 border-b border-border bg-primary-50">
              <Ionicons name="business-outline" size={16} color="#2563EB" />
              <Text className="text-primary font-semibold text-xs tracking-widest uppercase">
                Client Company
              </Text>
            </View>
            <View className="p-4">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
                Company *
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isLoadingCompanies) setCompanyDropdownOpen(!companyDropdownOpen);
                }}
                className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3.5 border border-border"
                activeOpacity={0.7}
              >
                <Ionicons name="business-outline" size={18} color="#2563EB" />
                <Text className={`font-medium flex-1 ${selectedCompany ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {selectedCompany ? companies.find(c => c.id === selectedCompany)?.name : "Select Company..."}
                </Text>
                {isLoadingCompanies ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Ionicons name={companyDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
                )}
              </TouchableOpacity>

              {companyDropdownOpen && !isLoadingCompanies && (
                <View className="mt-2 bg-white border border-border rounded-xl px-1 py-1">
                  {companies.map((c, idx) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setSelectedCompany(c.id);
                        setCompanyDropdownOpen(false);
                      }}
                      className={`px-4 py-3.5 ${idx !== companies.length - 1 ? "border-b border-border/60" : ""}`}
                    >
                      <Text className="text-text-primary text-base font-medium">{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Route Details */}
        <View className="bg-white rounded-2xl border border-border shadow-sm z-[100]">
          <View className="flex-row items-center gap-2 px-4 pt-4 pb-3 border-b border-border bg-primary-50 overflow-hidden rounded-t-[15px]">
            <Ionicons name="git-branch-outline" size={16} color="#2563EB" />
            <Text className="text-primary font-semibold text-xs tracking-widest uppercase">
              Route Details
            </Text>
          </View>
          <View className="p-4 gap-4 z-50">
            
            {/* Loading Site */}
            <View className="relative z-50">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
                Loading Site *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="radio-button-on" size={16} color="#2563EB" />
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder="Enter Facility Name or City"
                  placeholderTextColor="#94A3B8"
                  value={loadingSite}
                  onChangeText={handleLoadingSiteChange}
                  onFocus={() => {
                     if (loadingSuggestions.length > 0) setShowLoadingSuggestions(true);
                     setShowUnloadingSuggestions(false);
                  }}
                  onBlur={() => setTimeout(() => setShowLoadingSuggestions(false), 200)}
                />
              </View>
              {showLoadingSuggestions && (
                <View className="absolute top-[80px] left-0 right-0 bg-white border border-border rounded-xl shadow-lg z-[100] overflow-hidden max-h-40">
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {loadingSuggestions.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => {
                          setLoadingSite(s);
                          setShowLoadingSuggestions(false);
                        }}
                        className={`px-4 py-3 ${i !== loadingSuggestions.length - 1 ? 'border-b border-border/50' : ''}`}
                      >
                        <Text className="text-text-primary font-medium">{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Divider with arrow */}
            <View className="flex-row items-center px-2 z-10">
              <View className="flex-1 h-px bg-border" />
              <View className="mx-3 w-7 h-7 rounded-full bg-primary-100 items-center justify-center">
                <Ionicons name="arrow-down" size={14} color="#2563EB" />
              </View>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Unloading Site */}
            <View className="relative z-40">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
                Unloading Site *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="location" size={16} color="#2563EB" />
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder="Enter Facility Name or City"
                  placeholderTextColor="#94A3B8"
                  value={unloadingSite}
                  onChangeText={handleUnloadingSiteChange}
                  onFocus={() => {
                     if (unloadingSuggestions.length > 0) setShowUnloadingSuggestions(true);
                     setShowLoadingSuggestions(false);
                  }}
                  onBlur={() => setTimeout(() => setShowUnloadingSuggestions(false), 200)}
                />
              </View>
              {showUnloadingSuggestions && (
                <View className="absolute top-[80px] left-0 right-0 bg-white border border-border rounded-xl shadow-lg z-[100] overflow-hidden max-h-40">
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {unloadingSuggestions.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => {
                          setUnloadingSite(s);
                          setShowUnloadingSuggestions(false);
                        }}
                        className={`px-4 py-3 ${i !== unloadingSuggestions.length - 1 ? 'border-b border-border/50' : ''}`}
                      >
                        <Text className="text-text-primary font-medium">{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

          </View>
        </View>

        {/* Financial Details */}
        <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm z-10">
          <View className="flex-row items-center gap-2 px-4 pt-4 pb-3 border-b border-border bg-primary-50">
            <Ionicons name="cash-outline" size={16} color="#2563EB" />
            <Text className="text-primary font-semibold text-xs tracking-widest uppercase">
              Financial Information
            </Text>
          </View>
          <View className="p-4 gap-4">
            {/* Amount input (Changes based on trip type) */}
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
                {tripType === "cash" ? "Cash Amount *" : "Payment Amount *"}
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Text className="text-text-secondary font-semibold text-base">$</Text>
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={tripType === "cash" ? cashAmount : paymentAmount}
                  onChangeText={tripType === "cash" ? setCashAmount : setPaymentAmount}
                />
              </View>
            </View>

            {/* Road Expense */}
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
                Road Expense
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Text className="text-text-secondary font-semibold text-base">$</Text>
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={roadExpense}
                  onChangeText={(text) => setRoadExpense(text.replace(/[^0-9.]/g, ""))}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="bg-primary rounded-2xl py-4 items-center flex-row justify-center gap-3 shadow-sm z-0"
          activeOpacity={0.85}
          style={{ marginTop: 4, marginBottom: 32 }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name={isEditMode ? "checkmark-done" : "send"} size={18} color="#fff" />
              <Text className="text-white font-bold text-base tracking-wider uppercase">
                {isEditMode ? "Update Trip" : "Submit Trip"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
