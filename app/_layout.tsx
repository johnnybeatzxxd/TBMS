import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/src/store";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { restoreSession, isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
      await restoreSession();
      const state = useAuthStore.getState();
      console.log("[ROOT] Session restored:", {
        isAuthenticated: state.isAuthenticated,
        role: state.user?.role,
      });

      if (state.isAuthenticated && state.user) {
        if (state.user.role === "driver") {
          router.replace("/driver-dashboard");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        router.replace("/(auth)/login");
      }
    };
    bootstrap();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="drivers" options={{ headerShown: false }} />
        <Stack.Screen name="trucks" options={{ headerShown: false }} />
        <Stack.Screen name="companies" options={{ headerShown: false }} />
        <Stack.Screen name="company-details" options={{ headerShown: false }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="driver-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="driver-trips" options={{ headerShown: false }} />
        <Stack.Screen name="driver-expenses" options={{ headerShown: false }} />
        <Stack.Screen name="driver-refuels" options={{ headerShown: false }} />
        <Stack.Screen name="driver-transfers" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-refuel"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="manage-driver"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="add-request"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="add-truck"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="add-company"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="add-expense"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="add-transfer"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="add-trip"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
