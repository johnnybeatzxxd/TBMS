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
import { clearCacheKey } from "@/src/hooks/useCachedFetch";

export default function ManageDriverModal() {
  const { mode, id, name: initialName, truckId: initialTruckId, username: initialUsername, password: initialPassword, licenseRenewalDate: initialLicense } = useLocalSearchParams();
  const isEdit = mode === "edit";

  const [name, setName] = useState(isEdit ? initialName?.toString() || "" : "");
  const [username, setUsername] = useState(isEdit ? initialUsername?.toString() || "" : "");
  const [password, setPassword] = useState(isEdit ? initialPassword?.toString() || "" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [truckId, setTruckId] = useState(isEdit ? initialTruckId?.toString() || "" : "");
  const [truckName, setTruckName] = useState(isEdit ? initialTruckId?.toString() || "" : "");
  
  const [licenseDate, setLicenseDate] = useState<Date | null>(initialLicense && initialLicense !== "undefined" ? new Date(initialLicense.toString()) : null);
  
  const [showLicensePicker, setShowLicensePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [credsLoading, setCredsLoading] = useState(false);
  const [showCredsSection, setShowCredsSection] = useState(false);

  // Credential reset fields (edit mode only)
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Dropdown state
  const [trucks, setTrucks] = useState<{id: string; plateNumber: string}[]>([]);
  const [showTruckMenu, setShowTruckMenu] = useState(false);
  const [loadingTrucks, setLoadingTrucks] = useState(true);

  // Fetch unassigned trucks immediately when form opens
  useEffect(() => {
    setLoadingTrucks(true);
    truckService.getUnassignedTrucks().then((res) => {
      console.log("[ManageDriver] Unassigned trucks response:", JSON.stringify(res));
      const truckList = res.trucks || [];
      setTrucks(truckList);
      if (isEdit && initialTruckId) {
        const found = truckList.find(t => t.id === initialTruckId);
        if (found) {
          setTruckName(found.plateNumber);
        } else {
          setTruckName("Current Assigned Truck");
        }
      }
    }).catch((e) => { console.log("[ManageDriver] Truck fetch error:", e); setTrucks([]); }).finally(() => setLoadingTrucks(false));
  }, []);

  const handleProfileSubmit = async () => {
    if (!isEdit && (!name.trim() || !truckId.trim())) {
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
        const profilePayload: { truckId?: string; licenceExpiryDate?: string; name?: string } = {};
        
        if (truckId.trim() && truckId.trim() !== initialTruckId?.toString()) {
          profilePayload.truckId = truckId.trim();
        }
        if (name.trim() && name.trim() !== initialName?.toString()) {
          profilePayload.name = name.trim();
        }
        
        // Compare dates by day to avoid millisecond mismatch
        const currLicenseStr = licenseDate ? licenseDate.toISOString().split("T")[0] : "";
        const initialLicenseStr = initialLicense && initialLicense !== "undefined" ? 
          new Date(initialLicense.toString()).toISOString().split("T")[0] : "";
          
        if (currLicenseStr !== initialLicenseStr && licenseDate) {
          profilePayload.licenceExpiryDate = licenseDate.toISOString();
        }

        console.log("[ManageDriver] Updating profile for ID:", id.toString());
        console.log("[ManageDriver] Profile payload:", JSON.stringify(profilePayload));
        
        // Don't send empty requests
        if (Object.keys(profilePayload).length === 0) {
          Alert.alert("No Changes", "No fields were modified.", [{ text: "OK", onPress: () => router.back() }]);
          return;
        }

        await driverService.updateDriverProfile(id.toString(), profilePayload);
        clearCacheKey("DRIVERS");
        Alert.alert("Success", "Driver profile updated!", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        await driverService.createDriverAccount({
          name: name.trim(),
          username: username.trim(),
          password,
          truckId: truckId.trim(),
          licenseRenewalDate: licenseDate ? licenseDate.toISOString().split("T")[0] : undefined,
        });
        clearCacheKey("DRIVERS");
        Alert.alert("Success", "Driver account created!", [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch (error: any) {
      console.log("[ManageDriver] Profile submit error:", error.message, error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsReset = async () => {
    if (!newUsername.trim() && !newPassword.trim()) {
      Alert.alert("Error", "Please enter a new username or password.");
      return;
    }
    
    if (newPassword.trim() && newPassword.trim().length < 3) {
      Alert.alert("Error", "Password must be at least 3 characters.");
      return;
    }

    setCredsLoading(true);
    try {
      if (!id) throw new Error("Missing driver ID");
      const payload: { username?: string; password?: string } = {};
      if (newUsername.trim()) payload.username = newUsername.trim();
      if (newPassword.trim()) payload.password = newPassword.trim();
      
      console.log("[ManageDriver] Resetting credentials for ID:", id.toString());
      console.log("[ManageDriver] Credentials payload:", JSON.stringify(payload));
      await driverService.resetDriverCredentials(id.toString(), payload);
      Alert.alert("Success", "Driver credentials updated!", [{ text: "OK", onPress: () => {
        setNewUsername("");
        setNewPassword("");
        setShowCredsSection(false);
      }}]);
    } catch (error: any) {
      console.log("[ManageDriver] Credentials reset error:", error.message, error);
      Alert.alert("Error", error.message || "Failed to reset credentials");
    } finally {
      setCredsLoading(false);
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
            {isEdit ? "Edit Profile" : "Add Driver"}
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ gap: 24, paddingBottom: 60 }}>
          
          {/* ── SECTION 1: Profile Info ── */}
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
                  minimumDate={new Date()}
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

            {/* Username & Password - Create Mode Only */}
            {!isEdit && (
              <>
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

                <View className="gap-1">
                  <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                    Password *
                  </Text>
                  <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                    <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                    <TextInput
                      className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                      placeholder="driver_password"
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
              </>
            )}

            {/* Profile Action Buttons */}
            <View className="flex-row gap-4 mt-2">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 bg-surface-hover rounded-xl py-4 items-center justify-center border border-border"
                disabled={loading}
              >
                <Text className="text-text-secondary font-bold text-base">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleProfileSubmit}
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

          {/* ── SECTION 2: Credential Reset (Edit Mode Only) ── */}
          {isEdit && (
            <View className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowCredsSection(v => !v)}
                className="flex-row items-center justify-between p-5"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center border border-amber-200">
                    <Ionicons name="key-outline" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-text-primary font-bold text-base">Update Credentials</Text>
                    <Text className="text-text-secondary text-xs mt-0.5">Change username or password</Text>
                  </View>
                </View>
                <Ionicons name={showCredsSection ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
              </TouchableOpacity>

              {showCredsSection && (
                <View className="px-5 pb-5 gap-4 border-t border-border/50 pt-4">
                  <View className="gap-1">
                    <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                      New Username
                    </Text>
                    <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                      <Ionicons name="at" size={16} color="#64748B" />
                      <TextInput
                        className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                        placeholder="Leave blank to keep current"
                        placeholderTextColor="#94A3B8"
                        value={newUsername}
                        onChangeText={setNewUsername}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View className="gap-1">
                    <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                      New Password
                    </Text>
                    <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                      <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                      <TextInput
                        className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                        placeholder="Leave blank to keep current"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword((v) => !v)}>
                        <Ionicons
                          name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                          size={18}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleCredentialsReset}
                    disabled={credsLoading}
                    className="bg-amber-500 rounded-xl py-3.5 items-center justify-center mt-1 shadow-sm"
                  >
                    {credsLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="shield-checkmark" size={18} color="#fff" />
                        <Text className="text-white font-bold text-base">Reset Credentials</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
