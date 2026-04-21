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
import { useAuthStore } from "@/src/store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    clearError();
    await login({ email, password });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-900"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-10 items-center">
          <Text className="text-white text-4xl font-bold">🚛 TBMS</Text>
          <Text className="text-slate-400 text-sm mt-2">Sign in to continue</Text>
        </View>

        <View className="gap-4">
          {error && (
            <View className="bg-red-500/10 border border-red-500 p-3 rounded-lg">
              <Text className="text-red-500 text-sm">{error}</Text>
            </View>
          )}

          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700"
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <TextInput
            className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700"
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            className="bg-blue-600 p-4 rounded-xl items-center mt-2"
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
