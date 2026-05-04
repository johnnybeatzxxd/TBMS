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
import { companyService } from "@/src/api/services";

export default function AddCompanyModal() {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Company name is required.");
      return;
    }
    
    // Default to 0 if balance is omitted
    const startingBalance = balance.trim() ? Number(balance) : 0;
    if (isNaN(startingBalance)) {
      Alert.alert("Error", "Starting balance must be a valid number.");
      return;
    }

    setLoading(true);
    try {
      await companyService.addCompany({
        name: name.trim(),
        currentBalance: startingBalance,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add company");
    } finally {
      setLoading(false);
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
          <Text className="text-text-primary font-bold text-xl">
            Register Company
          </Text>
          <View className="w-10 h-10" />
        </View>

        <View className="flex-1 px-4 py-6 gap-6">
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-4">
            
            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Company Name *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="domain" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="e.g. Acme Logistics"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Starting Debt Balance (Optional)
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Text className="text-text-secondary font-semibold text-base">$</Text>
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={balance}
                  onChangeText={setBalance}
                />
              </View>
              <Text className="text-[10px] text-text-secondary mt-1 ml-1 leading-tight">
                Any pre-existing debt this company owes you.
              </Text>
            </View>

            <View className="flex-row gap-4 mt-2">
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
                className="flex-1 bg-amber-500 rounded-xl py-4 items-center justify-center shadow-sm shadow-amber-500"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base tracking-wide">
                    Register
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
