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
import { useLocalSearchParams, router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { driverService, truckService } from "@/src/api/services";

export default function ManageDriverModal() {
  const { mode, id, name: initialName, truckId: initialTruckId, username: initialUsername, password: initialPassword, licenseRenewalDate: initialLicense, oilChangeDate: initialOil } = useLocalSearchParams();
  const isEdit = mode === "edit";

  const [name, setName] = useState(isEdit ? initialName?.toString() || "" : "");
  const [username, setUsername] = useState(isEdit ? initialUsername?.toString() || "" : "");
  const [password, setPassword] = useState(isEdit ? initialPassword?.toString() || "" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [truckId, setTruckId] = useState(isEdit ? initialTruckId?.toString() || "" : "");
  const [truckName, setTruckName] = useState(isEdit ? initialTruckId?.toString() || "" : "");
  
  const [licenseDate, setLicenseDate] = useState<Date | null>(initialLicense && initialLicense !== "undefined" ? new Date(initialLicense.toString()) : null);
  const [oilDate, setOilDate] = useState<Date | null>(initialOil && initialOil !== "undefined" ? new Date(initialOil.toString()) : null);
  
  const [showLicensePicker, setShowLicensePicker] = useState(false);
  const [showOilPicker, setShowOilPicker] = useState(false);

  const [loading, setLoading] = useState(false);

  // Dropdown state
  const [trucks, setTrucks] = useState<{id: string; plateNumber: string}[]>([]);
  const [showTruckMenu, setShowTruckMenu] = useState(false);
  const [loadingTrucks, setLoadingTrucks] = useState(true);

  // Fetch unassigned trucks immediately when form opens
  useEffect(() => {
    setLoadingTrucks(true);
    truckService.getUnassignedTrucks().then((res) => {
      const truckList = res.trucks || [];
      setTrucks(truckList);
      if (isEdit && initialTruckId) {
        const found = truckList.find(t => t.id === initialTruckId);
        if (found) setTruckName(found.plateNumber);
      }
    }).catch(() => setTrucks([])).finally(() => setLoadingTrucks(false));
  }, []);

  const handleSubmit = async () => {
    // Basic validation
    if (!name.trim() || !truckId.trim()) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    
    if (!isEdit && (!username.trim() || !password.trim())) {
      Alert.alert("Error", "Please fill in username and password.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        if (!id) throw new Error("Missing driver ID for update");
        await driverService.updateDriverProfile(id.toString(), {
          name: name.trim(),
          password: password || undefined,
          truckId: truckId.trim(),
          licenseRenewalDate: licenseDate ? licenseDate.toISOString().split("T")[0] : undefined,
          oilChangeDate: oilDate ? oilDate.toISOString().split("T")[0] : undefined,
        });
        Alert.alert("Success", "Driver profile updated!", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        await driverService.createDriverAccount({
          name: name.trim(),
          username: username.trim(),
          password,
          truckId: truckId.trim(),
          licenseRenewalDate: licenseDate ? licenseDate.toISOString().split("T")[0] : undefined,
          oilChangeDate: oilDate ? oilDate.toISOString().split("T")[0] : undefined,
        });
        Alert.alert("Success", "Driver account created!", [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
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
            {isEdit ? "Edit Profile" : "Add Driver"}
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ gap: 24, paddingBottom: 60 }}>
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-4">
            
            {/* Name Field */}
            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Full Name *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="person-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="Enter full name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Truck Selection Dropdown */}
            <View className="gap-1 z-50">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Assigned Truck *
              </Text>
              
              <View className="relative">
                <TouchableOpacity
                  onPress={() => setShowTruckMenu((v) => !v)}
                  className="flex-row items-center bg-surface rounded-xl px-4 py-4 border border-border"
                  activeOpacity={0.8}
                >
                  <Ionicons name="car-outline" size={16} color="#64748B" />
                  <Text className={`flex-1 ml-3 text-base ${truckId ? "text-text-primary" : "text-[#94A3B8]"}`}>
                    {truckId ? truckName : "Select a truck"}
                  </Text>
                  <Ionicons name={showTruckMenu ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
                </TouchableOpacity>

                {showTruckMenu && (
                  <View className="absolute top-14 left-0 right-0 bg-white border border-border shadow-md rounded-xl max-h-48 z-50 overflow-hidden">
                    <ScrollView nestedScrollEnabled className="max-h-48">
                      {loadingTrucks ? (
                        <View className="p-4 items-center flex-row justify-center gap-2">
                          <ActivityIndicator size="small" color="#2563EB" />
                          <Text className="text-text-secondary text-sm">Loading trucks...</Text>
                        </View>
                      ) : trucks.length === 0 ? (
                        <View className="p-4 items-center">
                          <Text className="text-text-secondary">No available trucks</Text>
                        </View>
                      ) : (
                        trucks.map((truck) => (
                          <TouchableOpacity
                            key={truck.id}
                            onPress={() => {
                              setTruckId(truck.id);
                              setTruckName(truck.plateNumber);
                              setShowTruckMenu(false);
                            }}
                            className={`flex-row items-center px-4 py-3 border-b border-border-light ${
                              truckId === truck.id ? "bg-primary-50" : "bg-white"
                            }`}
                          >
                            <Text className={`flex-1 text-sm ${truckId === truck.id ? "text-primary font-semibold" : "text-text-primary"}`}>
                              {truck.plateNumber}
                            </Text>
                            {truckId === truck.id && (
                              <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* License Renewal Date Field */}
            <View className="gap-1 z-40">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                License Renewal Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowLicensePicker(true)}
                className="flex-row items-center bg-surface rounded-xl px-4 py-3.5 border border-border"
              >
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
                <Text className={`flex-1 ml-3 text-base ${licenseDate ? "text-text-primary" : "text-[#94A3B8]"}`}>
                  {licenseDate ? licenseDate.toISOString().split("T")[0] : "Select date"}
                </Text>
              </TouchableOpacity>
              
              {showLicensePicker && (
                <DateTimePicker
                  value={licenseDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") setShowLicensePicker(false);
                    if (selectedDate) setLicenseDate(selectedDate);
                  }}
                />
              )}
              {Platform.OS === "ios" && showLicensePicker && (
                <TouchableOpacity
                  onPress={() => setShowLicensePicker(false)}
                  className="mt-2 py-2 items-center bg-slate-100 rounded-lg"
                >
                  <Text className="text-primary font-semibold">Done</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Oil Change Date Field */}
            <View className="gap-1 z-30">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Oil Change Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowOilPicker(true)}
                className="flex-row items-center bg-surface rounded-xl px-4 py-3.5 border border-border"
              >
                <Ionicons name="water-outline" size={16} color="#64748B" />
                <Text className={`flex-1 ml-3 text-base ${oilDate ? "text-text-primary" : "text-[#94A3B8]"}`}>
                  {oilDate ? oilDate.toISOString().split("T")[0] : "Select date"}
                </Text>
              </TouchableOpacity>
              
              {showOilPicker && (
                <DateTimePicker
                  value={oilDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") setShowOilPicker(false);
                    if (selectedDate) setOilDate(selectedDate);
                  }}
                />
              )}
              {Platform.OS === "ios" && showOilPicker && (
                <TouchableOpacity
                  onPress={() => setShowOilPicker(false)}
                  className="mt-2 py-2 items-center bg-slate-100 rounded-lg"
                >
                  <Text className="text-primary font-semibold">Done</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Username Field - Only shown in Create Mode */}
            {!isEdit && (
              <View className="gap-1">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                  Username *
                </Text>
                <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                  <Ionicons name="at" size={16} color="#64748B" />
                  <TextInput
                    className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                    placeholder="driver_username"
                    placeholderTextColor="#94A3B8"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                {isEdit ? "Set New Password (optional)" : "Password *"}
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder={isEdit ? "Enter new password if changing" : "driver_password"}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
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
                className="flex-1 bg-primary rounded-xl py-4 items-center justify-center shadow-sm"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base tracking-wide">
                    {isEdit ? "Update Profile" : "Create Account"}
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
