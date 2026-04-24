import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";

type Role = "driver" | "manager";

export default function LoginScreen() {
  const [role, setRole] = useState<Role>("driver");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    // TEMPORARY BYPASS: Navigate to main app without validation
    // We navigate to (tabs) directly as requested
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo */}
          <View className="mb-8 items-center">
            <View className="w-20 h-20 rounded-3xl bg-primary items-center justify-center mb-4 shadow-lg">
              <MaterialCommunityIcons name="truck" size={40} color="#fff" />
            </View>
            <Text className="text-text-primary text-3xl font-bold tracking-tight">
              TBMS
            </Text>
            <Text className="text-text-secondary text-sm mt-1">
              Truck Business Management System
            </Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-3xl p-6 border border-border shadow-sm gap-5">
            {/* Role Switcher */}
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1 mb-2">
                Sign in as
              </Text>
              <View className="flex-row bg-surface rounded-xl overflow-hidden border border-border">
                <TouchableOpacity
                  onPress={() => setRole("driver")}
                  className={`flex-1 py-3.5 items-center rounded-xl flex-row justify-center gap-2 ${
                    role === "driver" ? "bg-primary" : "bg-transparent"
                  }`}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="steering"
                    size={16}
                    color={role === "driver" ? "#fff" : "#64748B"}
                  />
                  <Text
                    className={`font-bold text-sm tracking-wide ${
                      role === "driver" ? "text-white" : "text-text-secondary"
                    }`}
                  >
                    Driver
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRole("manager")}
                  className={`flex-1 py-3.5 items-center rounded-xl flex-row justify-center gap-2 ${
                    role === "manager" ? "bg-primary" : "bg-transparent"
                  }`}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={16}
                    color={role === "manager" ? "#fff" : "#64748B"}
                  />
                  <Text
                    className={`font-bold text-sm tracking-wide ${
                      role === "manager" ? "text-white" : "text-text-secondary"
                    }`}
                  >
                    Manager
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {error && (
              <View className="bg-danger-50 border border-danger rounded-xl px-4 py-3 flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-danger text-sm flex-1">{error}</Text>
              </View>
            )}

            {/* Username */}
            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Username
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="person-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder="Enter your username"
                  placeholderTextColor="#94A3B8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Password
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="lock-closed-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 text-text-primary py-3.5 pl-3 text-base"
                  placeholder="Enter your password"
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

            {/* Sign In Button */}
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center mt-1 flex-row justify-center gap-2"
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text className="text-white font-bold text-base tracking-wide">
                    Sign In as {role === "driver" ? "Driver" : "Manager"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
