import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";
import { mockRequestsService } from "@/src/api/mock/requests.mock";
import { mockTruckService } from "@/src/api/mock/trucks.mock";
import { ServiceRequest, RequestType } from "@/src/types/request.types";

const REQUEST_TYPES: RequestType[] = [
  "Oil Change",
  "Tire Replacement",
  "Maintenance",
  "Advance Payment",
  "Salary",
  "Other"
];

export default function AddRequestScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [trucks, setTrucks] = useState<any[]>([]);

  // Form State
  const [truckId, setTruckId] = useState("");
  const [type, setType] = useState<RequestType | "">("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [showTypeMenu, setShowTypeMenu] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await mockTruckService.getMyTrucks();
      if ("trucks" in res && res.trucks.length > 0) {
        setTrucks(res.trucks);
        setTruckId(res.trucks[0].id); // Auto-select first truck
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!truckId) return Alert.alert("Error", "Please select a truck.");
    if (!type) return Alert.alert("Error", "Please select a request type.");
    if (!description.trim()) return Alert.alert("Error", "Please provide a description.");

    // Amount is only required for Advance Payment and Salary
    if (["Advance Payment", "Salary"].includes(type) && !amount.trim()) {
       return Alert.alert("Error", "Please provide an amount for this request type.");
    }

    setLoading(true);
    try {
      await mockRequestsService.addRequest({
        truckId,
        driverId: user?.id || "d1",
        type,
        amount: amount ? Number(amount) : undefined,
        description: description.trim(),
        date: new Date().toISOString().split("T")[0], // Today's date
      });
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "manager" || user?.role === "admin") {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8">
        <Ionicons name="lock-closed-outline" size={48} color="#94A3B8" />
        <Text className="text-text-primary font-bold text-xl mt-4 text-center">
          Access Denied
        </Text>
        <Text className="text-text-secondary text-sm mt-2 text-center">
          Only drivers can submit service requests. Managers can review requests from the Manage panel.
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-8 bg-primary px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-border"
        >
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-xl">New Request</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-primary-50 rounded-full items-center justify-center mb-3">
              <Ionicons name="document-text" size={32} color="#2563EB" />
            </View>
            <Text className="text-text-primary text-xl font-bold">Submit a Request</Text>
            <Text className="text-text-secondary text-sm mt-1 text-center px-4">
              Submit maintenance, expense, or payment requests to management.
            </Text>
          </View>

          {/* Form Fields */}
          <View className="gap-6 z-50">

            {/* Request Type Dropdown */}
            <View className="relative z-50">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                Request Type *
              </Text>
              <TouchableOpacity
                onPress={() => setShowTypeMenu(!showTypeMenu)}
                className="bg-white border border-border rounded-xl h-14 px-4 flex-row items-center justify-between shadow-sm"
                activeOpacity={0.8}
              >
                <Text className={`text-base ${type ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                  {type || "Select a type..."}
                </Text>
                <Ionicons name={showTypeMenu ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
              </TouchableOpacity>

              {showTypeMenu && (
                <View className="absolute top-[80px] left-0 right-0 bg-white rounded-2xl border border-border shadow-lg overflow-hidden z-[999] elevation-20">
                  {REQUEST_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => {
                        setType(t);
                        setShowTypeMenu(false);
                      }}
                      className="px-4 py-3.5 border-b border-border/50"
                      activeOpacity={0.7}
                    >
                      <Text className={`text-base ${type === t ? "text-primary font-bold" : "text-text-primary"}`}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Amount Field (Conditionally Rendered) */}
            {(type === "Advance Payment" || type === "Salary" || type === "Maintenance" || type === "Other") && (
              <View className="z-0">
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                  Estimated Amount (ETB) {['Advance Payment', 'Salary'].includes(type as string) ? "*" : "(Optional)"}
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
                     <Text className="text-text-secondary font-bold text-lg">$</Text>
                  </View>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    className="bg-white border border-border rounded-xl h-14 pl-10 pr-4 text-base font-medium text-text-primary shadow-sm"
                  />
                </View>
              </View>
            )}

            {/* Description Area */}
            <View className="z-0">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                Description *
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Explain the reason for this request..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                className="bg-white border border-border rounded-xl p-4 min-h-[120px] text-base text-text-primary shadow-sm"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Actions */}
      <View className="p-5 bg-white border-t border-border shadow-lg z-0">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
          className={`h-14 rounded-xl flex-row items-center justify-center shadow-md ${
            loading ? "bg-primary/70" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#fff" className="mr-2" />
              <Text className="text-white font-bold text-lg ml-2">Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
