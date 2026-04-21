/**
 * Mock Auth Service
 * -----------------
 * Simulates login/logout/refresh with fake JWT tokens.
 * Replace with real API calls when backend is ready.
 */

import { LoginCredentials, AuthTokens, User } from "@/src/types";

const MOCK_DELAY = 800; // simulate network latency

const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "usr_001",
    name: "Admin User",
    email: "admin@tbms.com",
    password: "admin123",
    role: "admin",
    avatar: undefined,
  },
  {
    id: "usr_002",
    name: "John Driver",
    email: "driver@tbms.com",
    password: "driver123",
    role: "driver",
    avatar: undefined,
  },
  {
    id: "usr_003",
    name: "Sara Dispatcher",
    email: "dispatch@tbms.com",
    password: "dispatch123",
    role: "dispatcher",
    avatar: undefined,
  },
];

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const generateFakeJwt = (userId: string, type: "access" | "refresh") =>
  `mock_${type}_token_${userId}_${Date.now()}`;

export const mockAuthService = {
  async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; tokens: AuthTokens }> {
    await delay(MOCK_DELAY);

    const found = MOCK_USERS.find(
      (u) =>
        u.email === credentials.email && u.password === credentials.password
    );

    if (!found) {
      throw new Error("Invalid email or password");
    }

    const { password: _, ...user } = found;
    const tokens: AuthTokens = {
      accessToken: generateFakeJwt(user.id, "access"),
      refreshToken: generateFakeJwt(user.id, "refresh"),
    };

    return { user, tokens };
  },

  async logout(): Promise<void> {
    await delay(300);
    // In real API: POST /auth/logout with refresh token
  },

  async getProfile(token: string): Promise<User> {
    await delay(500);
    // Parse mock userId from token
    const userId = token.split("_")[3];
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (!found) throw new Error("User not found");
    const { password: _, ...user } = found;
    return user;
  },

  async refreshToken(
    refreshToken: string
  ): Promise<Pick<AuthTokens, "accessToken">> {
    await delay(400);
    const userId = refreshToken.split("_")[3];
    return { accessToken: generateFakeJwt(userId, "access") };
  },
};
