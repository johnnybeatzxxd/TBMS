import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { mockExpenseService } from "@/src/api/mock/expenses.mock";

export default function AddExpenseModal() {
  const [remark, setRemark] = useState("");
  const [price, setPrice] = useState("");
  
  // Hardcoding date to today for simplicity
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!remark.trim()) {
      Alert.alert("Validation", "Remark is required.");
      return;
    }
    
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Validation", "Please enter a valid price.");
      return;
    }

    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Validation", "Please enter a valid date (YYYY-MM-DD).");
      return;
    }

    setLoading(true);
    try {
      // Mock driver truck ID (since we don't have driver profile logic implemented yet pulling a specific truck)
      const mockAssignedTruckId = "trk_101";

      await mockExpenseService.addExpense(mockAssignedTruckId, {
        remark: remark.trim(),
        price: parsedPrice,
        date: date.trim(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4 bg-white border-b border-border shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-text-primary font-bold text-xl">
            Log Expense
          </Text>
          <View className="w-10 h-10" />
        </View>

        <View className="flex-1 px-4 py-6 gap-6">
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-5">
            
            <View className="gap-1.5">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Remark / Category *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="pricetag-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="e.g., Toll Fee, Parking, Maintenance"
                  placeholderTextColor="#94A3B8"
                  value={remark}
                  onChangeText={setRemark}
                />
              </View>
            </View>

            <View className="gap-1.5">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Price *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="cash-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View className="gap-1.5">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Date (YYYY-MM-DD) *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
            </View>

            <View className="flex-row gap-4 mt-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 bg-surface-hover rounded-xl py-4 items-center justify-center border border-border"
                disabled={loading}
              >
                <Text className="text-text-secondary font-bold text-base">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="flex-1 bg-primary rounded-xl py-4 items-center justify-center shadow-sm shadow-primary-500"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base tracking-wide">
                    Save Expense
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
