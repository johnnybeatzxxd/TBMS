/**
 * Auth Store (Zustand)
 * --------------------
 * Handles authentication state, JWT persistence, and user profile.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { User, AuthTokens, LoginCredentials } from "@/src/types";
import { authService } from "@/src/api/services";

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
  /** DEV ONLY: set a mock user directly (bypasses API) */
  setMockUser: (role: "manager" | "driver") => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { user, tokens } = await authService.login(credentials);
      // Persist tokens securely
      await SecureStore.setItemAsync("accessToken", tokens.accessToken);
      await SecureStore.setItemAsync("refreshToken", tokens.refreshToken);
      set({ user, tokens, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Login failed", isLoading: false });
    }
  },

  setMockUser: (role) => {
    const mockUser: User = {
      id: role === "manager" ? "mock_mgr_001" : "mock_drv_001",
      name: role === "manager" ? "Mock Manager" : "Mock Driver",
      username: role === "manager" ? "manager" : "driver1",
      email: role === "manager" ? "manager@tbms.com" : "driver@tbms.com",
      role,
    };
    set({ user: mockUser, isAuthenticated: true });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!accessToken || !refreshToken) {
        set({ isLoading: false });
        return;
      }
      const user = await authService.getProfile(accessToken);
      set({
        user,
        tokens: { accessToken, refreshToken },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token invalid or expired — clear and send to login
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
