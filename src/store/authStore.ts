/**
 * Auth Store (Zustand)
 * --------------------
 * Handles authentication state and user profile persistence.
 * Uses session-based auth (cookie managed manually via SecureStore).
 * Full user profile is saved locally for offline access and in-app usage.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { User, LoginCredentials } from "@/src/types";
import { authService } from "@/src/api/services";

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

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Login failed", isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch {
      // Even if server logout fails, clear local state
    } finally {
      await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
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
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Corrupted data — clear and send to login
      await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
