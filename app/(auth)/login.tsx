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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/src/store";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing Info", "Please enter both username and password.");
      return;
    }

    clearError();

    await login({ username: username.trim(), password });

    // The store catches errors internally, so check state after login
    const state = useAuthStore.getState();
    console.log("[LOGIN] Post-login state:", {
      user: state.user ? `${state.user.name} (${state.user.role})` : null,
      isAuthenticated: state.isAuthenticated,
      error: state.error,
    });

    if (state.error) {
      Alert.alert("Login Failed", state.error);
      return;
    }

    if (!state.user) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      return;
    }

    // Navigate based on role
    console.log("[LOGIN] Navigating for role:", state.user.role);
    if (state.user.role === "driver") {
      router.replace("/driver-dashboard");
    } else {
      router.replace("/admin-dashboard");
    }
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
            {/* Error Banner */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text className="text-red-600 text-sm font-medium flex-1">{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
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
                  autoCorrect={false}
                  editable={!isLoading}
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
                  editable={!isLoading}
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
              activeOpacity={0.85}
              disabled={isLoading}
              style={isLoading ? { opacity: 0.7 } : {}}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text className="text-white font-bold text-base tracking-wide">
                    Sign In
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
