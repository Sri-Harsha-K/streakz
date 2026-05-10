import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { AppState, Completion, Task } from '../types';
import { migrateColor } from './color';
import { ACTION_MARK_DONE } from './notificationConstants';
import { computeUpdatedStreak } from './streak';
import { today } from './date';
import { parseHHMM, scheduleDailyReminder } from './reminders';

// Time the "Come back tomorrow" replacement stays on screen *after* it
// becomes visible. The TIME_INTERVAL trigger needs ~1s to fire, so total
// wall clock time from tap is roughly TRIGGER_DELAY_MS + CONFIRM_VISIBLE_MS.
const TRIGGER_DELAY_MS = 1100;
const CONFIRM_VISIBLE_MS = 2000;

/**
 * Replace the source reminder with a transient "Come back tomorrow" message
 * in place (same Android notification tag = same identifier), then dismiss
 * it after a short window. Reusing the original identifier means
 * scheduleNotificationAsync first cancels the recurring DAILY trigger that
 * owns that identifier, so callers must hand back the daily-reminder
 * details and the new identifier so the DAILY can be re-scheduled.
 *
 * Shared by the background TaskManager handler and the foreground JS
 * listener so both paths produce the same UX.
 *
 * Returns the new daily-reminder identifier (or null if rescheduling failed
 * or the task no longer has a reminder).
 */
export async function presentMarkDoneConfirmation(
  taskTitle: string,
  taskId: string,
  sourceNotifId: string | undefined,
  reminderTime: string | null,
): Promise<string | null> {
  // Schedule the in-place replacement using the SAME identifier as the
  // visible daily reminder. Android dedupes by tag, so when the trigger
  // fires (1s) it overwrites the existing notification rather than stacking
  // a second one.
  if (sourceNotifId) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: sourceNotifId,
        content: {
          title: 'Come back tomorrow',
          body: `${taskTitle} — streak saved.`,
          sound: false,
          data: { kind: 'confirm', taskId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId: Platform.OS === 'android' ? 'habit-reminders' : undefined,
        },
      });
    } catch {
      // best-effort; if this fails the original notif just lingers
    }

    // Wait for the trigger to fire and the message to sit visible for
    // CONFIRM_VISIBLE_MS, then auto-swipe.
    await new Promise<void>(resolve =>
      setTimeout(resolve, TRIGGER_DELAY_MS + CONFIRM_VISIBLE_MS),
    );
    try {
      await Notifications.dismissNotificationAsync(sourceNotifId);
    } catch {
      // already swiped or expired; ignore
    }
    try {
      // The TIME_INTERVAL was one-shot and has already fired by now; this
      // call is defensive in case it has not, so we don't leave it queued.
      await Notifications.cancelScheduledNotificationAsync(sourceNotifId);
    } catch {
      // ignore
    }
  }

  // Reusing sourceNotifId killed the DAILY schedule that owned it. Bring
  // tomorrow's reminder back up under a fresh identifier.
  if (!reminderTime) return null;
  const parsed = parseHHMM(reminderTime);
  if (!parsed) return null;
  return scheduleDailyReminder(taskId, taskTitle, parsed.hour, parsed.minute);
}

// Background task name for notification-action responses dispatched while the
// app is killed or backgrounded. Foreground responses still go through the
// JS listener in <NotificationActionHandler />; the OS only routes to this
// task when JS is not alive, so the two paths do not double-fire.
export const NOTIF_RESPONSE_TASK = 'streak-notification-response';

const STORAGE_KEY = 'streakapp_v1';

function migrateTask(raw: Record<string, unknown>): Task {
  return {
    id: raw.id as string,
    title: raw.title as string,
    description: (raw.description as string) ?? '',
    createdAt: raw.createdAt as string,
    currentStreak: (raw.currentStreak as number) ?? 0,
    longestStreak: (raw.longestStreak as number) ?? 0,
    lastCompletedDate: (raw.lastCompletedDate as string | null) ?? null,
    color: migrateColor(raw.color),
    targetStreak: typeof raw.targetStreak === 'number' ? raw.targetStreak : 30,
    milestoneAcknowledged:
      typeof raw.milestoneAcknowledged === 'boolean' ? raw.milestoneAcknowledged : false,
    archived: typeof raw.archived === 'boolean' ? raw.archived : false,
    reminderTime: typeof raw.reminderTime === 'string' ? raw.reminderTime : null,
    reminderNotifId: typeof raw.reminderNotifId === 'string' ? raw.reminderNotifId : null,
    freezeNotifIds: Array.isArray(raw.freezeNotifIds) ? (raw.freezeNotifIds as string[]) : [],
  };
}

interface NotificationResponseTaskData {
  actionIdentifier?: string;
  userText?: string;
  notification?: {
    request?: {
      identifier?: string;
      content?: {
        // For locally scheduled notifications on Android, native code
        // serializes content.data as a JSON string under `dataString` and
        // does NOT populate `data`. The JS-facing listener path goes through
        // `mapNotificationResponse` which JSON.parses dataString into data,
        // but the TaskManager headless path receives the raw bundle, so we
        // must read both shapes here.
        data?: { taskId?: string; kind?: string };
        dataString?: string;
      };
    };
  };
}

function extractTaskId(payload: NotificationResponseTaskData | undefined): string | undefined {
  const content = payload?.notification?.request?.content;
  if (!content) return undefined;
  if (content.data?.taskId) return content.data.taskId;
  if (typeof content.dataString === 'string') {
    try {
      const parsed = JSON.parse(content.dataString) as { taskId?: string } | null;
      if (parsed && typeof parsed.taskId === 'string') return parsed.taskId;
    } catch {
      // malformed JSON; fall through
    }
  }
  return undefined;
}

async function handleMarkDone(taskId: string, notifIdentifier?: string): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  let parsed: { tasks: Record<string, unknown>[]; completions: Completion[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  const tasks: Task[] = (parsed.tasks ?? []).map(migrateTask);
  const completions: Completion[] = parsed.completions ?? [];

  const target = tasks.find(t => t.id === taskId);
  if (!target || target.archived) return;

  const t = today();
  if (completions.some(c => c.taskId === taskId && c.date === t)) return;

  const completion: Completion = {
    id: Crypto.randomUUID(),
    taskId,
    date: t,
    completedAt: new Date().toISOString(),
  };
  const newCompletions = [...completions, completion];

  const freezeIdsToCancel = target.freezeNotifIds ?? [];

  // Update the streak/milestone state. We deliberately leave reminderNotifId
  // pointing at the (now-cancelled) original identifier here and patch it in
  // a second write below, after we know the new id from rescheduling.
  let updatedTasks: Task[] = tasks.map(task => {
    if (task.id !== taskId) return task;
    const streakUpdate = computeUpdatedStreak(task, newCompletions);
    const milestoneAcknowledged =
      streakUpdate.currentStreak < task.targetStreak ? false : task.milestoneAcknowledged;
    return { ...task, ...streakUpdate, milestoneAcknowledged, freezeNotifIds: [] };
  });

  const intermediate: AppState = { tasks: updatedTasks, completions: newCompletions };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(intermediate));

  for (const id of freezeIdsToCancel) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // already fired or invalid; ignore
    }
  }

  const newReminderId = await presentMarkDoneConfirmation(
    target.title,
    taskId,
    notifIdentifier,
    target.reminderTime,
  );

  // Persist the new reminderNotifId so foreground code knows which schedule
  // is live and cancel/reschedule diffs work correctly going forward.
  if (newReminderId !== null && newReminderId !== target.reminderNotifId) {
    try {
      const latestRaw = await AsyncStorage.getItem(STORAGE_KEY);
      if (latestRaw) {
        const latest = JSON.parse(latestRaw) as {
          tasks: Record<string, unknown>[];
          completions: Completion[];
        };
        const latestTasks: Task[] = (latest.tasks ?? []).map(migrateTask);
        const patched = latestTasks.map(task =>
          task.id === taskId ? { ...task, reminderNotifId: newReminderId } : task,
        );
        const finalState: AppState = { tasks: patched, completions: latest.completions ?? [] };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalState));
      }
    } catch {
      // best-effort
    }
  }
}

if (!TaskManager.isTaskDefined(NOTIF_RESPONSE_TASK)) {
  TaskManager.defineTask(NOTIF_RESPONSE_TASK, async ({ data, error }) => {
    if (error) return;
    const payload = data as NotificationResponseTaskData | undefined;
    if (!payload) return;
    if (payload.actionIdentifier !== ACTION_MARK_DONE) return;
    const taskId = extractTaskId(payload);
    if (!taskId) return;
    const notifId = payload.notification?.request?.identifier;
    try {
      await handleMarkDone(taskId, notifId);
    } catch {
      // background task must never throw
    }
  });
}

export async function registerNotificationResponseTask(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(NOTIF_RESPONSE_TASK);
  } catch {
    // already registered or unsupported (e.g. Expo Go); fall back to JS listener
  }
}
