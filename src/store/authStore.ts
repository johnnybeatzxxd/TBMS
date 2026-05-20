/**
 * Auth Store (Zustand)
 * --------------------
 * Handles authentication state and user profile persistence.
 * Uses session-based auth (cookie managed manually via SecureStore).
 * Full user profile is saved locally for offline access and in-app usage.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, LoginCredentials } from "@/src/types";
import { authService } from "@/src/api/services";
import { clearSessionCookie } from "@/src/api/config";

const USER_PROFILE_KEY = "userProfile";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.login(credentials);

      // Persist the full user object locally (name, role, profile, trucks, etc.)
      await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(user));

      // Seed USER_PROFILE_DATA cache instantly so Profile screen works offline/instantly
      const { memoryCache } = require("../hooks/useCachedFetch");
      const cacheKey = "USER_PROFILE_DATA";
      memoryCache[cacheKey] = user.profile;
      await SecureStore.setItemAsync(`cache_${cacheKey}`, JSON.stringify(user.profile)).catch(() => {});

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Login failed", isLoading: false });
    }
  },

  logout: async () => {
    // 1. Immediately clear local state — don't wait for the API
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });

    // 2. Nuke ALL local storage to prevent data leakage between users
    const { clearCacheKey } = require("../hooks/useCachedFetch");
    clearCacheKey("USER_PROFILE_DATA");
    clearCacheKey("DRIVERS");
    clearCacheKey("TRUCKS");

    await Promise.allSettled([
      SecureStore.deleteItemAsync(USER_PROFILE_KEY),
      clearSessionCookie(),
      AsyncStorage.clear(), // Wipes notification tracking, cached data, everything
    ]);

    // 3. Fire-and-forget: notify the server, but never block on it
    authService.logout().catch(() => {});
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const profileStr = await SecureStore.getItemAsync(USER_PROFILE_KEY);
      if (!profileStr) {
        set({ isLoading: false });
        return;
      }
      const user: User = JSON.parse(profileStr);
      
      // Seed memoryCache on session restore so Profile opens instantly on app cold starts
      const { memoryCache } = require("../hooks/useCachedFetch");
      memoryCache["USER_PROFILE_DATA"] = user.profile;

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Corrupted data — clear and send to login
      await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
