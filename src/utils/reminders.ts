import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let handlerSet = false;
let androidChannelReady = false;
let categoryReady = false;

export const STREAK_CATEGORY_ID = 'STREAK_REMINDER';
export const ACTION_MARK_DONE = 'MARK_DONE';

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
  void ensureCategory();
}

async function ensureCategory() {
  if (categoryReady) return;
  try {
    await Notifications.setNotificationCategoryAsync(STREAK_CATEGORY_ID, [
      {
        identifier: ACTION_MARK_DONE,
        buttonTitle: '✓ Mark done',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
    categoryReady = true;
  } catch {
    // best-effort; category may already exist
    categoryReady = true;
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
  taskId: string,
  title: string,
  hour: number,
  minute: number,
): Promise<string | null> {
  try {
    await ensureAndroidChannel();
    await ensureCategory();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for: ${title}`,
        body: `Don't break your streak.`,
        sound: 'default',
        categoryIdentifier: STREAK_CATEGORY_ID,
        data: { taskId, kind: 'daily' },
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

const FREEZE_END_HOUR_LOCAL = 23;
const FREEZE_END_MINUTE_LOCAL = 30;

// Cadence ramps up as the day ends: every 2h until 17:00, every 1h until 20:00,
// every 30 min from 20:00 until cutoff.
function nextFreezeIntervalMs(cursor: Date): number {
  const h = cursor.getHours();
  if (h < 17) return 2 * 60 * 60 * 1000;
  if (h < 20) return 60 * 60 * 1000;
  return 30 * 60 * 1000;
}

export async function scheduleFreezeReminders(taskId: string, title: string): Promise<string[]> {
  await ensureAndroidChannel();
  await ensureCategory();
  const ids: string[] = [];
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(FREEZE_END_HOUR_LOCAL, FREEZE_END_MINUTE_LOCAL, 0, 0);

  // First slot: 2h from now (or sooner if late in day)
  let cursor = new Date(now.getTime() + nextFreezeIntervalMs(now));

  while (cursor.getTime() <= cutoff.getTime()) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `❄ Frozen: ${title}`,
          body: `Grace day in use — complete this habit before midnight.`,
          sound: 'default',
          categoryIdentifier: STREAK_CATEGORY_ID,
          data: { taskId, kind: 'freeze' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: cursor,
          channelId: Platform.OS === 'android' ? 'habit-reminders' : undefined,
        },
      });
      ids.push(id);
    } catch {
      // skip and continue with next slot
    }
    cursor = new Date(cursor.getTime() + nextFreezeIntervalMs(cursor));
  }
  return ids;
}

export async function cancelFreezeReminders(ids: string[] | undefined | null): Promise<void> {
  if (!ids || ids.length === 0) return;
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
