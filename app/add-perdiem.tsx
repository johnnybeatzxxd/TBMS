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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { expenseService } from "@/src/api/services";
import { useActionStore } from "@/src/store";

export default function AddPerdiemModal() {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [remark, setRemark] = useState("");
  const { isActionPending, startAction, stopAction } = useActionStore();
  const loading = isActionPending("submit_perdiem");

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Validation", "Please enter a valid amount.");
      return;
    }

    const formattedDate = date.toISOString().split("T")[0];

    startAction("submit_perdiem");
    try {
      await expenseService.addExpense("", {
        remark: remark.trim() || "Daily Perdiem",
        price: parsedAmount,
        date: formattedDate,
        tag: "PERDIME",
      });
      Alert.alert("Success", "Perdiem logged successfully.");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to log perdiem");
    } finally {
      stopAction("submit_perdiem");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4 bg-white border-b border-border shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-text-primary font-bold text-xl">Log Perdiem</Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ gap: 24, paddingBottom: 60 }}>
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-5">
            
            {/* Amount */}
            <View className="gap-1.5">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Amount *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="cash-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Date */}
            <View className="gap-1.5">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Date *
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center bg-surface rounded-xl px-4 py-3.5 border border-border"
              >
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
                <Text className="flex-1 ml-3 text-base text-text-primary">
                  {date.toISOString().split("T")[0]}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}
            </View>

            {/* Remark */}
            <View className="gap-1.5">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Remark
              </Text>
              <View className="flex-row items-start bg-surface rounded-xl px-4 py-3 border border-border min-h-[100px]">
                <Ionicons name="document-text-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
                <TextInput
                  className="flex-1 pl-3 text-base text-text-primary pt-0"
                  placeholder="Optional remark..."
                  placeholderTextColor="#94A3B8"
                  value={remark}
                  onChangeText={setRemark}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Footer Buttons */}
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
                  <Text className="text-white font-bold text-base tracking-wide">Save Perdiem</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
