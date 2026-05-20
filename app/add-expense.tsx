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

type ExpenseType = "Refuel" | "Maintenance" | "Others";
type MaintenanceType = "Oil" | "Tires" | "Brakes" | "Engine" | "Other";

const EXPENSE_TYPES: ExpenseType[] = ["Refuel", "Maintenance", "Others"];
const MAINTENANCE_TYPES: MaintenanceType[] = ["Oil", "Tires", "Brakes", "Engine", "Other"];

export default function AddExpenseModal() {
  const [type, setType] = useState<ExpenseType>("Refuel");
  const [price, setPrice] = useState("");
  
  // Hardcoding date to today for simplicity
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Dynamic fields
  const [liters, setLiters] = useState("");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>("Oil");
  const [showMaintenanceMenu, setShowMaintenanceMenu] = useState(false);
  const [description, setDescription] = useState("");
  const [kilometers, setKilometers] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Validation", "Please enter a valid price.");
      return;
    }

    const formattedDate = date.toISOString().split("T")[0];
    if (!formattedDate) {
      Alert.alert("Validation", "Please select a valid date.");
      return;
    }

    let finalRemark = "";

    if (type === "Refuel") {
      const parsedLiters = parseFloat(liters);
      if (!liters || isNaN(parsedLiters) || parsedLiters <= 0) {
        Alert.alert("Validation", "Please enter valid liters for refuel.");
        return;
      }
      finalRemark = `Refuel - ${parsedLiters} Liters`;
    } else if (type === "Maintenance") {
      if (maintenanceType === "Oil") {
        if (!kilometers.trim()) {
          Alert.alert("Validation", "Please enter Current K/m for oil maintenance.");
          return;
        }
        finalRemark = `Maintenance - Oil (${kilometers.trim()} K/m)`;
      } else {
        finalRemark = `Maintenance - ${maintenanceType}`;
      }
    } else if (type === "Others") {
      finalRemark = `Other`;
    }

    if (!description.trim()) {
      Alert.alert("Validation", "Description is required for all expenses.");
      return;
    }
    finalRemark = `${finalRemark} | Desc: ${description.trim()}`;

    setLoading(true);
    try {
      await expenseService.addExpense("", {
        remark: finalRemark,
        price: parsedPrice,
        date: formattedDate,
      });
      const { clearCachePrefix } = require("@/src/hooks/useCachedFetch");
      clearCachePrefix("DRIVER_EXPENSES");
      Alert.alert("Success", "Expense registered successfully.");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add expense");
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
            Log Expense
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ gap: 24, paddingBottom: 60 }}>
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-5">
            
            {/* Expense Type Selector */}
            <View className="gap-1.5 z-50 relative">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Expense Type *
              </Text>
              <TouchableOpacity
                onPress={() => setShowTypeMenu(!showTypeMenu)}
                className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-border"
              >
                <Ionicons name="pricetag-outline" size={16} color="#64748B" />
                <Text className="flex-1 ml-3 text-base text-text-primary">
                  {type}
                </Text>
                <Ionicons name={showTypeMenu ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
              </TouchableOpacity>

              {showTypeMenu && (
                <View className="absolute top-16 left-0 right-0 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <ScrollView nestedScrollEnabled className="max-h-48">
                    {EXPENSE_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => {
                          setType(t);
                          setShowTypeMenu(false);
                        }}
                        className={`flex-row items-center px-4 py-3 border-b border-border-light ${
                          type === t ? "bg-primary-50" : "bg-white"
                        }`}
                      >
                        <Text className={`flex-1 text-sm ${type === t ? "text-primary font-semibold" : "text-text-primary"}`}>
                          {t}
                        </Text>
                        {type === t && (
                          <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Dynamic Fields */}
            {type === "Refuel" && (
              <View className="gap-1.5">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                  Liters *
                </Text>
                <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                  <Ionicons name="water-outline" size={16} color="#64748B" />
                  <TextInput
                    className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                    placeholder="e.g., 50"
                    placeholderTextColor="#94A3B8"
                    value={liters}
                    onChangeText={setLiters}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}

            {type === "Maintenance" && (
              <View className="gap-1.5 relative z-40">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                  Maintenance Component *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMaintenanceMenu(!showMaintenanceMenu)}
                  className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-border"
                >
                  <Ionicons name="build-outline" size={16} color="#64748B" />
                  <Text className="flex-1 ml-3 text-base text-text-primary">
                    {maintenanceType}
                  </Text>
                  <Ionicons name={showMaintenanceMenu ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
                </TouchableOpacity>

                {showMaintenanceMenu && (
                  <View className="absolute top-16 left-0 right-0 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    <ScrollView nestedScrollEnabled className="max-h-48">
                      {MAINTENANCE_TYPES.map((mT) => (
                        <TouchableOpacity
                          key={mT}
                          onPress={() => {
                            setMaintenanceType(mT);
                            setShowMaintenanceMenu(false);
                          }}
                          className={`flex-row items-center px-4 py-3 border-b border-border-light ${
                            maintenanceType === mT ? "bg-primary-50" : "bg-white"
                          }`}
                        >
                          <Text className={`flex-1 text-sm ${maintenanceType === mT ? "text-primary font-semibold" : "text-text-primary"}`}>
                            {mT}
                          </Text>
                          {maintenanceType === mT && (
                            <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                {/* Specific Oil Fields */}
                {maintenanceType === "Oil" && (
                  <View className="gap-1.5 mt-3">
                    <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                      Current K/m *
                    </Text>
                    <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                      <Ionicons name="speedometer-outline" size={16} color="#64748B" />
                      <TextInput
                        className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                        placeholder="e.g., 150000"
                        placeholderTextColor="#94A3B8"
                        value={kilometers}
                        onChangeText={setKilometers}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Price (Common to all) */}
            <View className="gap-1.5 z-0">
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

            {/* Date (Common to all) */}
            <View className="gap-1.5 z-0">
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
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}
              {Platform.OS === "ios" && showDatePicker && (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="mt-2 py-2 items-center bg-slate-100 rounded-lg"
                >
                  <Text className="text-primary font-semibold">Done</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Common Description for all. Formerly only Others. */}
            <View className="gap-1.5">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Description *
              </Text>
              <View className="flex-row items-start bg-surface rounded-xl px-4 py-3 border border-border min-h-[100px]">
                <Ionicons name="document-text-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
                <TextInput
                  className="flex-1 pl-3 text-base text-text-primary pt-0"
                  placeholder="Describe the expense..."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
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
                    Save Expense
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
