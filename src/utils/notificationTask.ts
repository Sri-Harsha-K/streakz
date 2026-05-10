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

const CONFIRM_DISMISS_MS = 4000;

/**
 * Dismiss the source reminder and present a transient "Come back tomorrow"
 * confirmation that self-dismisses after a few seconds. Shared by the
 * background TaskManager handler and the foreground JS listener so users see
 * the same confirmation regardless of which path delivered the response.
 */
export async function presentMarkDoneConfirmation(
  taskTitle: string,
  taskId: string,
  sourceNotifId: string | undefined,
): Promise<void> {
  if (sourceNotifId) {
    try {
      await Notifications.dismissNotificationAsync(sourceNotifId);
    } catch {
      // best-effort
    }
  }

  let confirmId: string | null = null;
  try {
    confirmId = await Notifications.scheduleNotificationAsync({
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
    // best-effort; if this fails the user still sees the original dismissed
  }

  if (confirmId) {
    await new Promise<void>(resolve => setTimeout(resolve, CONFIRM_DISMISS_MS));
    try {
      await Notifications.dismissNotificationAsync(confirmId);
    } catch {
      // already swiped or expired; ignore
    }
  }
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
        data?: { taskId?: string; kind?: string };
      };
    };
  };
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

  // Cancel any pending freeze reminders for the now-completed task before we
  // strip them from the persisted shape.
  const freezeIdsToCancel = target.freezeNotifIds ?? [];

  const updatedTasks: Task[] = tasks.map(task => {
    if (task.id !== taskId) return task;
    const streakUpdate = computeUpdatedStreak(task, newCompletions);
    const milestoneAcknowledged =
      streakUpdate.currentStreak < task.targetStreak ? false : task.milestoneAcknowledged;
    return { ...task, ...streakUpdate, milestoneAcknowledged, freezeNotifIds: [] };
  });

  const next: AppState = { tasks: updatedTasks, completions: newCompletions };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  for (const id of freezeIdsToCancel) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // already fired or invalid; ignore
    }
  }

  await presentMarkDoneConfirmation(target.title, taskId, notifIdentifier);
}

if (!TaskManager.isTaskDefined(NOTIF_RESPONSE_TASK)) {
  TaskManager.defineTask(NOTIF_RESPONSE_TASK, async ({ data, error }) => {
    if (error) return;
    const payload = data as NotificationResponseTaskData | undefined;
    if (!payload) return;
    if (payload.actionIdentifier !== ACTION_MARK_DONE) return;
    const taskId = payload.notification?.request?.content?.data?.taskId;
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
