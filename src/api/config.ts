/**
 * API Configuration
 * -----------------
 * Central configuration for all API calls.
 * Uses 10.0.2.2 to reach host machine's localhost from Android emulator.
 * 
 * Session cookie from express-session is manually captured and stored
 * since React Native's fetch doesn't reliably handle cookies on Android.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Dynamically determine the local IP address if running via Expo Dev Server
// hostUri typically looks like "192.168.1.5:8081"
const getLocalApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ipAddress = hostUri.split(":")[0];
    return `http://${ipAddress}:3000`;
  }
  return Platform.select({
    android: "http://10.0.2.2:3000",
    ios: "http://localhost:3000",
    default: "http://localhost:3000",
  });
};

export const API_BASE_URL = getLocalApiUrl();

const SESSION_COOKIE_KEY = "sessionCookie";

/**
 * Save the session cookie extracted from a response's Set-Cookie header.
 */
export const saveSessionCookie = async (response: Response) => {
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    // Extract connect.sid cookie value (e.g. "connect.sid=s%3A...; Path=/; HttpOnly")
    const match = setCookie.match(/(connect\.sid=[^;]+)/);
    if (match) {
      await SecureStore.setItemAsync(SESSION_COOKIE_KEY, match[1]);
    }
  }
};

/**
 * Get the stored session cookie string.
 */
export const getSessionCookie = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(SESSION_COOKIE_KEY);
};

/**
 * Clear the stored session cookie on logout.
 */
export const clearSessionCookie = async () => {
  await SecureStore.deleteItemAsync(SESSION_COOKIE_KEY);
};

/**
 * Standard fetch wrapper that includes the stored session cookie
 * in every request for session-based authentication.
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Retrieve stored session cookie
  const sessionCookie = await getSessionCookie();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  // Attach session cookie if we have one
  if (sessionCookie) {
    headers["Cookie"] = sessionCookie;
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  return response;
};
