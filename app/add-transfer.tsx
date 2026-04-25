import { useState, useEffect } from "react";
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
import { mockTransferService } from "@/src/api/mock/transfers.mock";
import { mockDriverService } from "@/src/api/mock/drivers.mock";
import { useAuthStore } from "@/src/store";

export default function AddTransferModal() {
  const [driverId, setDriverId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"increment" | "decrement">("increment");
  const [remark, setRemark] = useState("");
  
  // Hardcoding date to today for simplicity
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const [loading, setLoading] = useState(false);

  // State for Drivers dropdown
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [showDriverMenu, setShowDriverMenu] = useState(false);
  const [driverName, setDriverName] = useState("");

  const { user } = useAuthStore();
  const isDriver = user?.role === "driver";

  useEffect(() => {
    if (isDriver && user) {
      setDriverId(user.id);
      setDriverName(user.name);
    } else {
      mockDriverService.getMyDrivers().then((res) => {
        setDrivers(res.drivers.map(d => ({ id: d.id, name: d.name })));
      });
    }
  }, [isDriver, user]);

  const handleSubmit = async () => {
    if (!driverId) {
      Alert.alert("Validation", "Please select a driver.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Validation", "Please enter a valid amount.");
      return;
    }

    if (!remark.trim()) {
      Alert.alert("Validation", "Remark is required.");
      return;
    }

    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Validation", "Please enter a valid date (YYYY-MM-DD).");
      return;
    }

    setLoading(true);
    try {
      await mockTransferService.addTransfer({
        driverId,
        amount: parsedAmount,
        type,
        remark: remark.trim(),
        date: date.trim(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to log transfer");
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
            Transfer
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ gap: 24, paddingBottom: 60 }}>
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-5">
            
            {/* Driver Selection - Only for Managers */}
            {!isDriver && (
              <View className="gap-1.5 relative z-50">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                  Driver *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDriverMenu(!showDriverMenu)}
                  className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-border"
                >
                  <Ionicons name="person-outline" size={16} color="#64748B" />
                  <Text className={`flex-1 ml-2 text-base ${driverName ? "text-text-primary" : "text-slate-400"}`}>
                    {driverName || "Select a Driver"}
                  </Text>
                  <Ionicons name={showDriverMenu ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
                </TouchableOpacity>

                {showDriverMenu && (
                  <View className="absolute top-16 left-0 right-0 bg-white border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-hidden">
                    <ScrollView nestedScrollEnabled>
                      {drivers.map((drv) => (
                        <TouchableOpacity
                          key={drv.id}
                          onPress={() => {
                            setDriverId(drv.id);
                            setDriverName(drv.name);
                            setShowDriverMenu(false);
                          }}
                          className={`flex-row items-center px-4 py-3 border-b border-border-light ${
                            driverId === drv.id ? "bg-primary-50" : "bg-white"
                          }`}
                        >
                          <Text className={`flex-1 text-sm ${driverId === drv.id ? "text-primary font-semibold" : "text-text-primary"}`}>
                            {drv.name}
                          </Text>
                          {driverId === drv.id && (
                            <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                          )}
                        </TouchableOpacity>
                      ))}
                      {drivers.length === 0 && (
                        <View className="p-4 items-center">
                          <Text className="text-text-secondary text-sm">No drivers found.</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Type Selection */}
            <View className="gap-1.5 z-0">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Transfer Type *
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setType("increment")}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
                    type === "increment" 
                      ? "bg-success-50 border-success-500" 
                      : "bg-surface border-border"
                  }`}
                >
                  <Ionicons name="arrow-up" size={16} color={type === "increment" ? "#16A34A" : "#64748B"} />
                  <Text className={`ml-1 font-semibold text-sm ${type === "increment" ? "text-success-700" : "text-text-secondary"}`}>
                    Credit (Add)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setType("decrement")}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
                    type === "decrement" 
                      ? "bg-danger-50 border-danger-500" 
                      : "bg-surface border-border"
                  }`}
                >
                  <Ionicons name="arrow-down" size={16} color={type === "decrement" ? "#DC2626" : "#64748B"} />
                  <Text className={`ml-1 font-semibold text-sm ${type === "decrement" ? "text-danger-700" : "text-text-secondary"}`}>
                    Debit (Subtract)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount */}
            <View className="gap-1.5 z-0">
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

            {/* Remark */}
            <View className="gap-1.5 z-0">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Remark / Note *
              </Text>
              <View className="flex-row items-start bg-surface rounded-xl px-4 py-3 border border-border min-h-[100px]">
                <Ionicons name="document-text-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
                <TextInput
                  className="flex-1 pl-3 text-base text-text-primary pt-0"
                  placeholder="Reason for transfer..."
                  placeholderTextColor="#94A3B8"
                  value={remark}
                  onChangeText={setRemark}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Date */}
            <View className="gap-1.5 z-0">
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

            <View className="flex-row gap-4 mt-4 z-0">
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
                    Save Transfer
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
