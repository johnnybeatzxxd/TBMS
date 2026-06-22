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
import DateTimePicker from "@react-native-community/datetimepicker";
import { transferService, driverService } from "@/src/api/services";
import { useAuthStore, useActionStore } from "@/src/store";
import { ReceiptImageUploader } from "@/src/components/ReceiptImageUploader";
import { uploadTransferReceipt } from "@/src/utils/firebaseUpload";

export default function AddTransferModal() {
  const [driverId, setDriverId] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [bank, setBank] = useState("");
  const [receiptPicUrls, setReceiptPicUrls] = useState<string[]>([]);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [hasIncompleteReceipt, setHasIncompleteReceipt] = useState(false);
  
  // Hardcoding date to today for simplicity
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { isActionPending, startAction, stopAction } = useActionStore();
  const loading = isActionPending("submit_transfer");

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
      driverService.getMyDrivers().then((res) => {
        setDrivers(res.drivers.map(d => ({ id: d.id, name: d.name })));
      }).catch(() => setDrivers([]));
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

    if (isUploadingReceipt) {
      Alert.alert("Please wait", "Transfer pictures are still uploading.");
      return;
    }

    if (hasIncompleteReceipt) {
      Alert.alert(
        "Picture not uploaded",
        "One or more transfer pictures did not finish uploading. Please retry or remove them."
      );
      return;
    }

    const formattedDate = date.toISOString().split("T")[0];
    if (!formattedDate) {
      Alert.alert("Validation", "Please select a valid date.");
      return;
    }

    startAction("submit_transfer");
    try {
      await transferService.addTransfer({
        driverId: isDriver ? undefined : driverId, // driverId undefined if it's the driver doing it
        amount: parsedAmount,
        remark: remark.trim(),
        date: formattedDate,
        bank: bank.trim() || undefined,
        receiptPics: receiptPicUrls,
      });
      // Lazy import keeps the cache utility out of the screen's initial module graph.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { clearCachePrefix } = require("@/src/hooks/useCachedFetch");
      clearCachePrefix("DRIVER_TRANSFERS");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to log transfer");
    } finally {
      stopAction("submit_transfer");
    }
  };

  const submitDisabled = loading || isUploadingReceipt;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
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
                  onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"

                />
              </View>
            </View>

            {/* Bank */}
            <View className="gap-1.5 z-0">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Bank / Account
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="business-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="e.g. Commercial Bank..."
                  placeholderTextColor="#94A3B8"
                  value={bank}
                  onChangeText={setBank}
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

            <ReceiptImageUploader
              maxImages={2}
              uploadImage={uploadTransferReceipt}
              onUrlsChange={setReceiptPicUrls}
              onUploadingChange={setIsUploadingReceipt}
              onIncompleteChange={setHasIncompleteReceipt}
              sectionTitle="Transfer Receipt"
              fieldLabel="Receipt / Optional Photos"
            />

            <View className="flex-row gap-4 mt-4 z-0">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 bg-surface-hover rounded-xl py-4 items-center justify-center border border-border"
                disabled={submitDisabled}
              >
                <Text className="text-text-secondary font-bold text-base">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitDisabled}
                className={`flex-1 rounded-xl py-4 items-center justify-center shadow-sm shadow-primary-500 ${
                  submitDisabled ? "bg-primary/60" : "bg-primary"
                }`}
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
