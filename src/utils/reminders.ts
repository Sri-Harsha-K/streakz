import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let handlerSet = false;
let androidChannelReady = false;

export function configureNotifications() {
  if (!handlerSet) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerSet = true;
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || androidChannelReady) return;
  await Notifications.setNotificationChannelAsync('habit-reminders', {
    name: 'Habit reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
  androidChannelReady = true;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (!settings.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}

export function parseHHMM(value: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function formatHHMM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export async function scheduleDailyReminder(
  title: string,
  hour: number,
  minute: number,
): Promise<string | null> {
  try {
    await ensureAndroidChannel();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for: ${title}`,
        body: `Don't break your streak.`,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === 'android' ? 'habit-reminders' : undefined,
      },
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelReminder(notifId: string | null | undefined): Promise<void> {
  if (!notifId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch {
    // already cancelled or invalid id; ignore
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
