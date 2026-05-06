import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { BackHandler } from "react-native";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/src/store";
import { useRouteGuard } from "@/src/utils/routeGuard";

export const unstable_settings = {
  anchor: "admin-dashboard",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { restoreSession, isAuthenticated, isLoading, user } = useAuthStore();
  const hasBootstrapped = useRef(false);

  // Activate the role-based route guard
  useRouteGuard();

  useEffect(() => {
    const bootstrap = async () => {
      await restoreSession();
      const state = useAuthStore.getState();
      console.log("[ROOT] Session restored:", {
        isAuthenticated: state.isAuthenticated,
        role: state.user?.role,
      });

      // Small delay to ensure the Stack navigator has mounted
      setTimeout(() => {
        if (state.isAuthenticated && state.user) {
          if (state.user.role === "driver") {
            router.replace("/driver-dashboard");
          } else {
            router.replace("/admin-dashboard");
          }
        } else {
          router.replace("/(auth)/login");
        }
        hasBootstrapped.current = true;
      }, 0);
    };
    bootstrap();
  }, []);

  // Reactive auth guard — redirect to login whenever auth is lost (only after bootstrap)
  useEffect(() => {
    if (hasBootstrapped.current && !isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="admin-trips" options={{ headerShown: false }} />
        <Stack.Screen name="admin-expenses" options={{ headerShown: false }} />
        <Stack.Screen name="admin-transfers" options={{ headerShown: false }} />
        <Stack.Screen name="admin-requests" options={{ headerShown: false }} />
        <Stack.Screen name="admin-analytics" options={{ headerShown: false }} />
        <Stack.Screen name="admin-refuels" options={{ headerShown: false }} />
        <Stack.Screen name="admin-reminders" options={{ headerShown: false }} />
        <Stack.Screen name="admin-displays" options={{ headerShown: false }} />
        <Stack.Screen name="admin-manage" options={{ headerShown: false }} />
        <Stack.Screen name="drivers" options={{ headerShown: false }} />
        <Stack.Screen name="driver-detail" options={{ headerShown: false }} />
        <Stack.Screen name="trucks" options={{ headerShown: false }} />
        <Stack.Screen name="companies" options={{ headerShown: false }} />
        <Stack.Screen name="company-details" options={{ headerShown: false }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
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
        <Stack.Screen
          name="add-reminder"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="add-display"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
