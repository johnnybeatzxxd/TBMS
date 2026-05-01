import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { authService } from "@/src/api/auth.service";
import { useAuthStore } from "@/src/store";
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatCurrency = (amount: number) =>
  `$${Math.abs(amount).toFixed(2)}`;

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const isDriver = user?.role === "driver";

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  // Change credentials modal
  const [showCredModal, setShowCredModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const data = await authService.getProfile();
      setProfileData(data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!newPassword && !newUsername.trim()) {
      Alert.alert("Validation", "Please enter a new username or password.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }

    setSavingCreds(true);
    try {
      Alert.alert("Notice", "Profile credentials updates should be managed by your admin.");
      setShowCredModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update credentials.");
    } finally {
      setSavingCreds(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-text-secondary mt-3">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const accountActive = profileData?.accountActive ?? true;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Background + Avatar */}
        <View className="bg-primary pt-6 pb-16 px-5 rounded-b-3xl relative">
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/driver-dashboard");
              }
            }}
            className="absolute top-6 left-5 z-20 w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/30"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <Text className="text-white/70 text-xs font-semibold tracking-widest uppercase text-center mb-4">
            Driver Profile
          </Text>

          {/* Avatar */}
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 items-center justify-center mb-3">
              <Text className="text-white text-3xl font-bold">
                {getInitials(user?.name || "D")}
              </Text>
            </View>

            {/* Name */}
            <Text className="text-white text-2xl font-bold tracking-wide">
              {user?.name || "Driver"}
            </Text>

            {/* Status Badge */}
            <View
              className={`mt-2 px-4 py-1.5 rounded-full flex-row items-center gap-1.5 ${
                accountActive ? "bg-success-500/20" : "bg-danger-500/20"
              }`}
            >
              <View
                className={`w-2 h-2 rounded-full ${
                  accountActive ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <Text
                className={`text-xs font-bold tracking-wider uppercase ${
                  accountActive ? "text-green-300" : "text-red-300"
                }`}
              >
                {accountActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content — overlapping cards */}
        <View className="px-4 -mt-10 gap-4">
          {/* Balance Card */}
          <View className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <View className="flex-row items-center gap-2 px-5 pt-5 pb-3">
              <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center border border-primary-100">
                <Ionicons name="wallet-outline" size={20} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase">
                  Driver Balance
                </Text>
              </View>
            </View>
            <View className="px-5 pb-5">
              <Text
                className={`text-3xl font-bold ${
                  (profileData?.balance || 0) >= 0 ? "text-success-600" : "text-danger-600"
                }`}
              >
                {(profileData?.balance || 0) >= 0 ? "+" : "-"}{formatCurrency(profileData?.balance || 0)}
              </Text>
              <Text className="text-text-secondary text-xs mt-1">
                Approved Cash trips: ${profileData?.approvedBalance || 0}
              </Text>
            </View>
          </View>

          {/* Info Cards */}
          <View className="bg-white rounded-2xl border border-border shadow-sm p-5 gap-4">
            <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-1">
              Account Details
            </Text>

            {/* Truck Info */}
            <View className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3.5 border border-border">
              <View className="w-9 h-9 rounded-full bg-sky-50 items-center justify-center border border-sky-100">
                <Ionicons name="car-sport-outline" size={16} color="#0EA5E9" />
              </View>
              <View className="flex-1">
                <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                  Assigned Truck
                </Text>
                <Text className="text-text-primary font-bold text-sm mt-0.5">
                  {profileData?.truck?.plateNumber || "Not Assigned"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>

            {/* Manager Info */}
            <View className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3.5 border border-border">
              <View className="w-9 h-9 rounded-full bg-violet-50 items-center justify-center border border-violet-100">
                <Ionicons name="business-outline" size={16} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                  Assigned Company
                </Text>
                <Text className="text-text-primary font-bold text-sm mt-0.5">
                  {profileData?.company?.name || "No Company"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>

            {/* Username */}
            <View className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3.5 border border-border">
              <View className="w-9 h-9 rounded-full bg-amber-50 items-center justify-center border border-amber-100">
                <Ionicons name="at-outline" size={16} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
                  Username
                </Text>
                <Text className="text-text-primary font-bold text-sm mt-0.5">
                  @{user?.username || "—"}
                </Text>
              </View>
            </View>


          </View>

          {/* Actions */}
          <View className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase px-5 pt-5 pb-2">
              Quick Actions
            </Text>

            {/* Change Credentials */}
            <TouchableOpacity
              onPress={() => setShowCredModal(true)}
              className="flex-row items-center gap-3 px-5 py-4 border-b border-border/50"
              activeOpacity={0.7}
            >
              <View className="w-9 h-9 rounded-full bg-primary-50 items-center justify-center border border-primary-100">
                <Ionicons name="key-outline" size={16} color="#2563EB" />
              </View>
              <Text className="flex-1 text-text-primary font-semibold text-sm">
                Change Credentials
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center gap-3 px-5 py-4"
              activeOpacity={0.7}
            >
              <View className="w-9 h-9 rounded-full bg-danger-50 items-center justify-center border border-danger-100">
                <Ionicons name="log-out-outline" size={16} color="#DC2626" />
              </View>
              <Text className="flex-1 text-danger font-semibold text-sm">
                Sign Out
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* App Version Footer */}
          <View className="items-center pt-4 pb-2">
            <Text className="text-text-secondary/50 text-xs font-medium">
              TBMS v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Change Credentials Modal */}
      <Modal visible={showCredModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-text-primary font-bold text-lg">
                Change Credentials
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCredModal(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="w-8 h-8 rounded-full bg-surface items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              {/* Username */}
              <View className="gap-1.5">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                  Username
                </Text>
                <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                  <Ionicons name="at-outline" size={16} color="#64748B" />
                  <TextInput
                    className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                    placeholder="Enter new username"
                    placeholderTextColor="#94A3B8"
                    value={newUsername}
                    onChangeText={setNewUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* New Password */}
              <View className="gap-1.5">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                  New Password
                </Text>
                <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                  <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                  <TextInput
                    className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                    placeholder="Enter new password"
                    placeholderTextColor="#94A3B8"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              {newPassword.length > 0 && (
                <View className="gap-1.5">
                  <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                    Confirm Password
                  </Text>
                  <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                    <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                    <TextInput
                      className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                      placeholder="Confirm password"
                      placeholderTextColor="#94A3B8"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveCredentials}
                disabled={savingCreds}
                className="bg-primary rounded-xl py-4 items-center justify-center mt-2"
                activeOpacity={0.85}
              >
                {savingCreds ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base tracking-wide">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
