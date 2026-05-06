import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const NOTIFIED_ALERTS_KEY = '@notified_alerts_set';

/**
 * Attempts to lazy-load expo-notifications at runtime.
 * Returns null if unavailable (e.g. Expo Go on SDK 53+).
 */
function getNotificationsModule() {
  // Expo Go (SDK 53+) throws a fatal uncatchable error when requiring expo-notifications.
  // We must abort before the require() call executes.
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';
  
  if (isExpoGo) {
    return null;
  }

  try {
    const mod = require('expo-notifications');
    // Quick smoke test — if the native module is broken this will throw
    if (mod && typeof mod.getPermissionsAsync === 'function') {
      return mod;
    }
  } catch (_) {}
  return null;
}

let _setupDone = false;

export const notificationUtils = {
  /**
   * Request permissions and set up Android channels.
   * Gracefully no-ops in Expo Go.
   */
  async setupPushNotificationsAsync(): Promise<boolean> {
    if (_setupDone) return true;

    const Notifications = getNotificationsModule();
    if (!Notifications) {
      console.log('[Notifications] Not available in this environment — bell icon & modal still work.');
      return false;
    }

    try {
      // Configure foreground behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        console.log('[Notifications] Permission not granted');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Fleet Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
        });
      }

      _setupDone = true;
      return true;
    } catch (e) {
      console.log('[Notifications] Setup failed (likely Expo Go):', e);
      return false;
    }
  },

  /**
   * Schedule a local push notification.
   * Silently no-ops if notifications aren't available.
   */
  async scheduleLocalNotification(title: string, body: string, data: any = {}) {
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: true },
        trigger: null,
      });
    } catch (e) {
      // Silent fail in Expo Go
    }
  },

  /**
   * Fetch the set of IDs we've already fired notifications for.
   */
  async getNotifiedIds(): Promise<Set<string>> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFIED_ALERTS_KEY);
      if (stored) return new Set(JSON.parse(stored));
    } catch (_) {}
    return new Set();
  },

  /**
   * Save the updated set of notified IDs.
   */
  async saveNotifiedIds(ids: Set<string>): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFIED_ALERTS_KEY, JSON.stringify(Array.from(ids)));
    } catch (_) {}
  },

  /**
   * Process a batch of alert items. Tracks which IDs have already been seen
   * and fires push notifications only for new ones (if available).
   * The ID tracking always works — even without push support.
   */
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
