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
import { useLocalSearchParams, router } from "expo-router";
import { mockDriverService } from "@/src/api/mock/drivers.mock";
import { mockTruckService } from "@/src/api/mock/trucks.mock";
import { Truck } from "@/src/types";

export default function ManageDriverModal() {
  const { mode, id, name: initialName, truckId: initialTruckId } = useLocalSearchParams();
  const isEdit = mode === "edit";

  const [name, setName] = useState(isEdit ? initialName?.toString() || "" : "");
  const [username, setUsername] = useState(isEdit ? useLocalSearchParams().username?.toString() || "" : "");
  const [password, setPassword] = useState(isEdit ? useLocalSearchParams().password?.toString() || "" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [truckId, setTruckId] = useState(isEdit ? initialTruckId?.toString() || "" : "");
  const [truckName, setTruckName] = useState(isEdit ? initialTruckId?.toString() || "" : ""); // Default to ID if name not known
  const [loading, setLoading] = useState(false);

  // Dropdown state
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [showTruckMenu, setShowTruckMenu] = useState(false);

  // Fetch trucks for dropdown
  useState(() => {
    mockTruckService.getMyTrucks().then((res) => {
      const truckList = "trucks" in res ? res.trucks : [];
      setTrucks(truckList);
      if (isEdit && initialTruckId) {
        const found = truckList.find(t => t.id === initialTruckId);
        if (found) setTruckName(`${found.plateNumber}${found.vinNumber ? ` - ${found.vinNumber}` : ""}`);
      }
    });
  });

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
        await mockDriverService.updateDriverProfile(id.toString(), {
          name: name.trim(),
          username: username.trim(),
          password: password.trim(),
          truckId: truckId.trim(),
        });
        router.back();
      } else {
        await mockDriverService.createDriver({
          name: name.trim(),
          username: username.trim(),
          password,
          truckId: truckId.trim(),
        });
        router.back();
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

        <View className="flex-1 px-4 py-6 gap-6">
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-4">
            
            {/* Name Field */}
            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Full Name
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
                Assigned Truck
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
                    {trucks.length === 0 ? (
                      <View className="p-4 items-center">
                        <Text className="text-text-secondary">Loading trucks...</Text>
                      </View>
                    ) : (
                      trucks.map((truck) => (
                        <TouchableOpacity
                          key={truck.id}
                          onPress={() => {
                            setTruckId(truck.id);
                            setTruckName(`${truck.plateNumber}${truck.vinNumber ? ` - ${truck.vinNumber}` : ""}`);
                            setShowTruckMenu(false);
                          }}
                          className={`flex-row items-center px-4 py-3 border-b border-border-light ${
                            truckId === truck.id ? "bg-primary-50" : "bg-white"
                          }`}
                        >
                          <Text className={`flex-1 text-sm ${truckId === truck.id ? "text-primary font-semibold" : "text-text-primary"}`}>
                            {truck.plateNumber}{truck.vinNumber ? ` - ${truck.vinNumber}` : ""}
                          </Text>
                          {truckId === truck.id && (
                            <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Fields for Both Create and Edit Mode */}
            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Username
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
                Password
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
