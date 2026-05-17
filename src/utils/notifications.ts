import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";

const NOTIFIED_ALERTS_KEY = "@notified_alerts_set";
const LOG = "[Notifications]";

export function isExpoGoEnvironment(): boolean {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === "expo"
  );
}

function getNotificationsModule() {
  if (isExpoGoEnvironment()) {
    console.log(LOG, "Expo Go detected — native FCM token is not available. Use a dev/production build.");
    return null;
  }

  try {
    const mod = require("expo-notifications");
    if (mod && typeof mod.getPermissionsAsync === "function") {
      return mod;
    }
  } catch (e) {
    console.log(LOG, "Failed to load expo-notifications:", e);
  }
  return null;
}

let _handlerConfigured = false;
let _openAppHandlerRegistered = false;

function formatError(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message: string }).message);
  }
  return String(e);
}

export const notificationUtils = {
  /**
   * Request notification permission on the login screen (before sign-in).
   */
  async requestPushPermissionOnLoginScreen(): Promise<boolean> {
    console.log(LOG, "requestPushPermissionOnLoginScreen", {
      platform: Platform.OS,
      isExpoGo: isExpoGoEnvironment(),
    });

    const Notifications = getNotificationsModule();
    if (!Notifications) return false;

    try {
      if (!_handlerConfigured) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
        _handlerConfigured = true;
      }

      let { status } = await Notifications.getPermissionsAsync();
      console.log(LOG, "Current permission status:", status);

      if (status !== "granted") {
        const result = await Notifications.requestPermissionsAsync();
        status = result.status;
        console.log(LOG, "Permission after request:", status);
      }

      if (status !== "granted") {
        console.log(LOG, "Permission denied — login will proceed without deviceToken");
        return false;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Fleet Alerts",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#2563EB",
        });
      }

      return true;
    } catch (e) {
      console.log(LOG, "requestPushPermissionOnLoginScreen failed:", formatError(e));
      return false;
    }
  },

  /**
   * Native FCM token (Android) / APNs token (iOS). Call right before login.
   */
  async getFcmDeviceTokenForLogin(): Promise<string | null> {
    console.log(LOG, "getFcmDeviceTokenForLogin…");

    if (isExpoGoEnvironment()) {
      console.log(LOG, "Skipping FCM token — not supported in Expo Go");
      return null;
    }

    const Notifications = getNotificationsModule();
    if (!Notifications) {
      console.log(LOG, "Notifications module unavailable");
      return null;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      console.log(LOG, "Cannot get FCM token — permission not granted:", status);
      return null;
    }

    try {
      const pushToken = await Notifications.getDevicePushTokenAsync();
      const token = pushToken?.data;
      console.log(LOG, "FCM device token:", token);
      if (!token) {
        console.log(LOG, "getDevicePushTokenAsync returned empty data", pushToken);
        return null;
      }

      console.log(LOG, "FCM device token OK", {
        type: pushToken.type,
        platform: Platform.OS,
        length: token.length,
        preview: `${token.slice(0, 16)}…`,
      });
      return token;
    } catch (e) {
      const msg = formatError(e);
      console.log(LOG, "getDevicePushTokenAsync FAILED:", msg);
      if (Platform.OS === "android") {
        console.log(
          LOG,
          "Android FCM requires google-services.json in the project root and " +
            '"android.googleServicesFile": "./google-services.json" in app.json, then rebuild the app.'
        );
      }
      return null;
    }
  },

  /** Permission on mount + token fetch (used right before login). */
  async prepareFcmTokenForLogin(): Promise<string | null> {
    await this.requestPushPermissionOnLoginScreen();
    return this.getFcmDeviceTokenForLogin();
  },

  async setupPushNotificationsAsync(): Promise<boolean> {
    return this.requestPushPermissionOnLoginScreen();
  },

  registerOpenAppHandler(): void {
    if (_openAppHandlerRegistered) return;

    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    try {
      Notifications.addNotificationResponseReceivedListener(
        (response: { notification: { request: { content: unknown } } }) => {
          console.log(LOG, "Notification tapped — app opened", {
            data: response?.notification?.request?.content,
          });
        }
      );
      _openAppHandlerRegistered = true;
    } catch (e) {
      console.log(LOG, "Could not register tap handler:", formatError(e));
    }
  },

  async scheduleLocalNotification(title: string, body: string, data: any = {}) {
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: true },
        trigger: null,
      });
    } catch (_) {}
  },

  async getNotifiedIds(): Promise<Set<string>> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFIED_ALERTS_KEY);
      if (stored) return new Set(JSON.parse(stored));
    } catch (_) {}
    return new Set();
  },

  async saveNotifiedIds(ids: Set<string>): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFIED_ALERTS_KEY, JSON.stringify(Array.from(ids)));
    } catch (_) {}
  },

  async processNewAlerts(
    items: any[],
    getId: (item: any) => string,
    formatNotification: (item: any) => { title: string; body: string }
  ) {
    const notifiedIds = await this.getNotifiedIds();
    let hasNew = false;

    for (const item of items) {
      const id = getId(item);
      if (!notifiedIds.has(id)) {
        const { title, body } = formatNotification(item);
        await this.scheduleLocalNotification(title, body, { id });
        notifiedIds.add(id);
        hasNew = true;
      }
    }

    if (hasNew) {
      await this.saveNotifiedIds(notifiedIds);
    }
  },
};
