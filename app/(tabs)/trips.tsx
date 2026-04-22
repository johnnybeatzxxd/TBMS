import { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

type PaymentMethod = "dispatch" | "cash";

export default function TripsScreen() {
  const [tripDate, setTripDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingSite, setLoadingSite] = useState("");
  const [unloadingSite, setUnloadingSite] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dispatch");
  const [dispatchAmount, setDispatchAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
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
    const amount = paymentMethod === "dispatch" ? dispatchAmount : cashAmount;
    if (!amount || isNaN(Number(amount))) {
      Alert.alert("Validation Error", "Please enter a valid amount.");
      return;
    }
    setIsSubmitting(true);
    // TODO: connect to API
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    Alert.alert("Success", "Trip logged successfully!");
    setLoadingSite("");
    setUnloadingSite("");
    setDispatchAmount("");
    setCashAmount("");
    setPaymentMethod("dispatch");
    setTripDate(new Date());
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>


      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Date */}
        <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <View className="px-4 pt-4 pb-2">
            <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
              Trip Date
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
              onChange={onDateChange}
            />
          )}
          <View className="h-4" />
        </View>

        {/* Route Details */}
        <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <View className="flex-row items-center gap-2 px-4 pt-4 pb-3 border-b border-border bg-primary-50">
            <Ionicons name="git-branch-outline" size={16} color="#2563EB" />
            <Text className="text-primary font-semibold text-xs tracking-widest uppercase">
              Route Details
            </Text>
          </View>
          <View className="p-4 gap-4">
            {/* Loading Site */}
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
                Loading Site
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="radio-button-on" size={16} color="#2563EB" />
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder="Enter Facility Name or City"
                  placeholderTextColor="#94A3B8"
                  value={loadingSite}
                  onChangeText={setLoadingSite}
                />
              </View>
            </View>

            {/* Divider with arrow */}
            <View className="flex-row items-center px-2">
              <View className="flex-1 h-px bg-border" />
              <View className="mx-3 w-7 h-7 rounded-full bg-primary-100 items-center justify-center">
                <Ionicons name="arrow-down" size={14} color="#2563EB" />
              </View>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Unloading Site */}
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
                Unloading Site
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="location" size={16} color="#2563EB" />
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder="Enter Facility Name or City"
                  placeholderTextColor="#94A3B8"
                  value={unloadingSite}
                  onChangeText={setUnloadingSite}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <View className="flex-row items-center gap-2 px-4 pt-4 pb-3 border-b border-border bg-primary-50">
            <Ionicons name="card-outline" size={16} color="#2563EB" />
            <Text className="text-primary font-semibold text-xs tracking-widest uppercase">
              Payment Method
            </Text>
          </View>
          <View className="p-4 gap-4">
            {/* Toggle */}
            <View className="flex-row bg-surface rounded-xl overflow-hidden border border-border">
              <TouchableOpacity
                onPress={() => setPaymentMethod("dispatch")}
                className={`flex-1 py-3 items-center rounded-xl ${
                  paymentMethod === "dispatch" ? "bg-primary-700" : "bg-transparent"
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-bold text-sm tracking-widest uppercase ${
                    paymentMethod === "dispatch" ? "text-white" : "text-text-secondary"
                  }`}
                >
                  Dispatch
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaymentMethod("cash")}
                className={`flex-1 py-3 items-center rounded-xl ${
                  paymentMethod === "cash" ? "bg-primary-700" : "bg-transparent"
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`font-bold text-sm tracking-widest uppercase ${
                    paymentMethod === "cash" ? "text-white" : "text-text-secondary"
                  }`}
                >
                  Cash
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
                {paymentMethod === "dispatch" ? "Dispatch Amount" : "Cash Amount"}
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Text className="text-text-secondary font-semibold text-base">$</Text>
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={paymentMethod === "dispatch" ? dispatchAmount : cashAmount}
                  onChangeText={
                    paymentMethod === "dispatch" ? setDispatchAmount : setCashAmount
                  }
                />
              </View>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="bg-primary rounded-2xl py-4 items-center flex-row justify-center gap-3 shadow-sm"
          activeOpacity={0.85}
          style={{ marginTop: 4, marginBottom: 8 }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text className="text-white font-bold text-base tracking-wider uppercase">
                Submit Trip
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
