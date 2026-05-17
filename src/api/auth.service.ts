/**
 * Auth Service (Real API)
 * -----------------------
 * Handles authentication against the real backend.
 * Session-based auth — the server sets a `connect.sid` cookie via express-session.
 */

import { LoginCredentials, User, UserProfile } from "@/src/types";
import { apiFetch, saveSessionCookie, clearSessionCookie } from "./config";

export const authService = {
  /**
   * Login with username and password.
   * Backend returns { message, profile: {...} } and sets session cookie.
   */
  async login(credentials: LoginCredentials): Promise<{ user: User }> {
    console.log("[AUTH] Attempting login for:", credentials.username);

    const body: Record<string, string> = {
      username: credentials.username,
      password: credentials.password,
    };
    if (credentials.deviceToken) {
      body.deviceToken = credentials.deviceToken;
    }

    console.log("[AUTH] Login body includes deviceToken:", !!credentials.deviceToken, {
      tokenLength: credentials.deviceToken?.length ?? 0,
      tokenPreview: credentials.deviceToken
        ? `${credentials.deviceToken.slice(0, 16)}…`
        : null,
    });

    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    console.log("[AUTH] Response status:", res.status);
    console.log("[AUTH] Response headers:", JSON.stringify(Object.fromEntries(res.headers.entries())));

    // Capture the session cookie from express-session
    await saveSessionCookie(res);

    const data = await res.json();
    console.log("[AUTH] Response body:", JSON.stringify(data));

    if (res.status === 401) {
      throw new Error(data.message || "Invalid username or password");
    }
    if (res.status === 403) {
      throw new Error(data.message || "Your account has been deactivated");
    }
    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (!data.profile) {
      console.error("[AUTH] No profile in response:", data);
      throw new Error("Server returned success but no profile data");
    }

    const profile: UserProfile = {
      id: data.profile.id,
      name: data.profile.name,
      accountId: data.profile.accountId,
      deviceToken: data.profile.deviceToken,
      createdAt: data.profile.createdAt,
      updatedAt: data.profile.updatedAt,
      trucks: data.profile.trucks || [],
      contractedCompanies: data.profile.contractedCompanies || [],
      assignedTruckId: data.profile.assignedTruckId,
    };

    // Determine role: admin profiles have `trucks` array, drivers don't
    const isAdmin = Array.isArray(data.profile.trucks);
    console.log("[AUTH] Role detection - has trucks array:", isAdmin);

    const user: User = {
      id: profile.id,
      name: profile.name,
      username: credentials.username,
      role: isAdmin ? "admin" : "driver",
      profile,
    };

    console.log("[AUTH] Built user object:", JSON.stringify(user));

    return { user };
  },

  /**
   * Logout — destroys the server session and clears local cookie.
   */
  async logout(): Promise<void> {
    console.log("[AUTH] Logging out...");
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
      });
    } finally {
      await clearSessionCookie();
      console.log("[AUTH] Session cookie cleared");
    }
  },

  /**
   * Health check to verify the API is reachable.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await apiFetch("/auth/test");
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Retrieves the comprehensive profile of the authenticated user.
   */
  async getProfile(): Promise<any> {
    const res = await apiFetch("/auth/get-profile");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch profile");
    }
    return res.json();
  },
};
