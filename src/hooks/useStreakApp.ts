import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { AppState as AppStateData, Task, Completion } from '../types';
import { today } from '../utils/date';
import { checkAndResetStreak, computeUpdatedStreak, isTodayCompleted, computeStreakAtDate, isTaskFrozen } from '../utils/streak';
import { migrateColor } from '../utils/color';
import {
  cancelAllReminders,
  cancelFreezeReminders,
  cancelReminder,
  ensureNotificationPermission,
  parseHHMM,
  scheduleDailyReminder,
  scheduleFreezeReminders,
} from '../utils/reminders';

const UNDO_WINDOW_MS = 10000;

interface RecentCompletion {
  taskId: string;
  completedAt: number;
}

const STORAGE_KEY = 'streakapp_v1';
const EMPTY: AppStateData = { tasks: [], completions: [] };
export const MAX_ACTIVE_TASKS = 20;

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
    milestoneAcknowledged: typeof raw.milestoneAcknowledged === 'boolean' ? raw.milestoneAcknowledged : false,
    archived: typeof raw.archived === 'boolean' ? raw.archived : false,
    reminderTime: typeof raw.reminderTime === 'string' ? raw.reminderTime : null,
    reminderNotifId: typeof raw.reminderNotifId === 'string' ? raw.reminderNotifId : null,
    freezeNotifIds: Array.isArray(raw.freezeNotifIds) ? (raw.freezeNotifIds as string[]) : [],
  };
}

async function loadState(): Promise<AppStateData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as { tasks: Record<string, unknown>[]; completions: Completion[] };
    return {
      tasks: parsed.tasks.map(migrateTask),
      completions: parsed.completions ?? [],
    };
  } catch {
    return EMPTY;
  }
}

async function saveState(state: AppStateData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uuid(): string {
  return Crypto.randomUUID();
}

export function useStreakApp() {
  const [state, setState] = useState<AppStateData>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);
  const [recentCompletion, setRecentCompletion] = useState<RecentCompletion | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearUndoTimer() {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }

  function armUndoTimer(taskId: string) {
    clearUndoTimer();
    undoTimerRef.current = setTimeout(() => {
      setRecentCompletion(prev => (prev?.taskId === taskId ? null : prev));
      undoTimerRef.current = null;
    }, UNDO_WINDOW_MS);
  }

  useEffect(() => {
    return () => clearUndoTimer();
  }, []);

  // Initial async load
  useEffect(() => {
    let cancelled = false;
    loadState().then(s => {
      if (cancelled) return;
      setState(s);
      loadedRef.current = true;
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Persist on change, but only after first load completes (avoid wiping disk)
  useEffect(() => {
    if (!loadedRef.current) return;
    saveState(state).catch(() => {});
  }, [state]);

  // Streak reset interval
  useEffect(() => {
    if (!loaded) return;
    function syncStreaks() {
      setState(prev => {
        const updatedTasks = prev.tasks.map(task => {
          const reset = checkAndResetStreak(task);
          if (reset.currentStreak !== task.currentStreak) {
            return { ...task, currentStreak: reset.currentStreak };
          }
          return task;
        });
        const changed = updatedTasks.some((t, i) => t.currentStreak !== prev.tasks[i]?.currentStreak);
        return changed ? { ...prev, tasks: updatedTasks } : prev;
      });
    }

    syncStreaks();
    const interval = setInterval(syncStreaks, 60_000);
    return () => clearInterval(interval);
  }, [loaded]);

  const createTask = useCallback((
    title: string,
    description: string,
    color: number,
    targetStreak: number,
    reminderTime: string | null = null,
  ) => {
    const id = uuid();
    let added = false;
    setState(prev => {
      const activeCount = prev.tasks.filter(t => !t.archived).length;
      if (activeCount >= MAX_ACTIVE_TASKS) return prev;
      const task: Task = {
        id,
        title,
        description,
        createdAt: new Date().toISOString(),
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        color,
        targetStreak,
        milestoneAcknowledged: false,
        archived: false,
        reminderTime: reminderTime || null,
        reminderNotifId: null,
        freezeNotifIds: [],
      };
      added = true;
      return { ...prev, tasks: [...prev.tasks, task] };
    });
    if (added && reminderTime) {
      scheduleReminderForTask(id, title, reminderTime);
    }
  }, []);

  const scheduleReminderForTask = useCallback(
    async (taskId: string, title: string, reminderTime: string) => {
      const parsed = parseHHMM(reminderTime);
      if (!parsed) return;
      const granted = await ensureNotificationPermission();
      if (!granted) return;
      const notifId = await scheduleDailyReminder(taskId, title, parsed.hour, parsed.minute);
      if (!notifId) return;
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, reminderNotifId: notifId } : t)),
      }));
    },
    [],
  );

  const ensureFreezeReminders = useCallback(async (taskId: string, title: string) => {
    const granted = await ensureNotificationPermission();
    if (!granted) return;
    const ids = await scheduleFreezeReminders(taskId, title);
    if (ids.length === 0) return;
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, freezeNotifIds: ids } : t)),
    }));
  }, []);

  const clearFreezeRemindersFor = useCallback((taskId: string, ids: string[]) => {
    cancelFreezeReminders(ids);
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, freezeNotifIds: [] } : t)),
    }));
  }, []);

  // Sync freeze reminders with task state. Schedule when task becomes frozen,
  // cancel when it stops being frozen (mark complete, midnight reset, archive).
  useEffect(() => {
    if (!loaded) return;
    state.tasks.forEach(task => {
      const frozen = isTaskFrozen(task);
      const has = (task.freezeNotifIds ?? []).length > 0;
      if (frozen && !has) {
        ensureFreezeReminders(task.id, task.title);
      } else if (!frozen && has) {
        clearFreezeRemindersFor(task.id, task.freezeNotifIds);
      }
    });
  }, [state.tasks, loaded, ensureFreezeReminders, clearFreezeRemindersFor]);

  const archiveTask = useCallback((taskId: string) => {
    let toCancel: string | null = null;
    let freezeIds: string[] = [];
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        toCancel = t.reminderNotifId;
        freezeIds = t.freezeNotifIds ?? [];
        return { ...t, archived: true, reminderNotifId: null, freezeNotifIds: [] };
      }),
    }));
    cancelReminder(toCancel);
    cancelFreezeReminders(freezeIds);
  }, []);

  const unarchiveTask = useCallback((taskId: string) => {
    let title = '';
    let reminderTime: string | null = null;
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        title = t.title;
        reminderTime = t.reminderTime;
        return { ...t, archived: false };
      }),
    }));
    if (reminderTime) {
      scheduleReminderForTask(taskId, title, reminderTime);
    }
  }, [scheduleReminderForTask]);

  const updateTask = useCallback(
    (
      taskId: string,
      patch: Partial<Pick<Task, 'title' | 'description' | 'color' | 'targetStreak' | 'reminderTime'>>,
    ) => {
      let prevTask: Task | undefined;
      let nextTask: Task | undefined;
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => {
          if (t.id !== taskId) return t;
          prevTask = t;
          const merged: Task = { ...t, ...patch };
          if (patch.targetStreak !== undefined && patch.targetStreak !== t.targetStreak) {
            merged.milestoneAcknowledged = false;
          }
          if (patch.reminderTime !== undefined) {
            merged.reminderNotifId = null;
          }
          nextTask = merged;
          return merged;
        }),
      }));

      if (!prevTask || !nextTask) return;

      const titleChanged = nextTask.title !== prevTask.title;
      const reminderChanged = nextTask.reminderTime !== prevTask.reminderTime;

      if (reminderChanged || (titleChanged && nextTask.reminderTime)) {
        cancelReminder(prevTask.reminderNotifId);
        if (nextTask.reminderTime && !nextTask.archived) {
          scheduleReminderForTask(taskId, nextTask.title, nextTask.reminderTime);
        }
      }
    },
    [scheduleReminderForTask],
  );

  const deleteTask = useCallback((taskId: string) => {
    let toCancel: string | null = null;
    let freezeIds: string[] = [];
    setState(prev => {
      const target = prev.tasks.find(t => t.id === taskId);
      toCancel = target?.reminderNotifId ?? null;
      freezeIds = target?.freezeNotifIds ?? [];
      return {
        tasks: prev.tasks.filter(t => t.id !== taskId),
        completions: prev.completions.filter(c => c.taskId !== taskId),
      };
    });
    cancelReminder(toCancel);
    cancelFreezeReminders(freezeIds);
  }, []);

  const clearAll = useCallback(() => {
    cancelAllReminders();
    setState({ tasks: [], completions: [] });
  }, []);

  const exportData = useCallback((): string => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: state,
    };
    return JSON.stringify(payload, null, 2);
  }, [state]);

  const importData = useCallback<
    (rawJson: string, mode: 'replace' | 'merge') =>
      | { ok: true; counts: { tasks: number; completions: number } }
      | { ok: false; error: string }
  >(
    (rawJson, mode) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        return { ok: false, error: 'Not valid JSON' };
      }
      if (typeof parsed !== 'object' || parsed === null) {
        return { ok: false, error: 'Invalid backup shape' };
      }
      const root = parsed as Record<string, unknown>;
      const dataField = root.data ?? root;
      if (typeof dataField !== 'object' || dataField === null) {
        return { ok: false, error: 'Missing data block' };
      }
      const dataObj = dataField as Record<string, unknown>;
      const rawTasks = dataObj.tasks;
      const rawCompletions = dataObj.completions;
      if (!Array.isArray(rawTasks) || !Array.isArray(rawCompletions)) {
        return { ok: false, error: 'tasks/completions must be arrays' };
      }
      let migratedTasks: Task[];
      try {
        migratedTasks = rawTasks.map(t => ({
          ...migrateTask(t as Record<string, unknown>),
          reminderNotifId: null,
          freezeNotifIds: [],
        }));
      } catch {
        return { ok: false, error: 'Could not parse tasks' };
      }
      const migratedCompletions = rawCompletions as Completion[];

      cancelAllReminders();

      setState(prev => {
        if (mode === 'replace') {
          return { tasks: migratedTasks, completions: migratedCompletions };
        }
        const taskById = new Map(prev.tasks.map(t => [t.id, t]));
        for (const t of migratedTasks) taskById.set(t.id, t);
        const compById = new Map(prev.completions.map(c => [c.id, c]));
        for (const c of migratedCompletions) compById.set(c.id, c);
        return {
          tasks: [...taskById.values()],
          completions: [...compById.values()],
        };
      });

      for (const task of migratedTasks) {
        if (!task.archived && task.reminderTime) {
          scheduleReminderForTask(task.id, task.title, task.reminderTime);
        }
      }

      return { ok: true, counts: { tasks: migratedTasks.length, completions: migratedCompletions.length } };
    },
    [scheduleReminderForTask],
  );

  const markComplete = useCallback((taskId: string) => {
    const t = today();
    let didMark = false;
    setState(prev => {
      if (isTodayCompleted(taskId, prev.completions)) return prev;

      const completion: Completion = {
        id: uuid(),
        taskId,
        date: t,
        completedAt: new Date().toISOString(),
      };

      const newCompletions = [...prev.completions, completion];

      const updatedTasks = prev.tasks.map(task => {
        if (task.id !== taskId) return task;
        const streakUpdate = computeUpdatedStreak(task, newCompletions);
        const milestoneAcknowledged =
          streakUpdate.currentStreak < task.targetStreak ? false : task.milestoneAcknowledged;
        return { ...task, ...streakUpdate, milestoneAcknowledged };
      });

      didMark = true;
      return { tasks: updatedTasks, completions: newCompletions };
    });
    if (didMark) {
      setRecentCompletion({ taskId, completedAt: Date.now() });
      armUndoTimer(taskId);
    }
  }, []);

  const undoTodayCompletion = useCallback((taskId: string) => {
    const t = today();
    setState(prev => {
      const wasToday = prev.completions.some(c => c.taskId === taskId && c.date === t);
      if (!wasToday) return prev;
      const remaining = prev.completions.filter(c => !(c.taskId === taskId && c.date === t));
      const taskDates = remaining
        .filter(c => c.taskId === taskId)
        .map(c => c.date)
        .sort();
      const lastDate = taskDates.length ? taskDates[taskDates.length - 1] : null;
      const newStreak = lastDate ? computeStreakAtDate(taskId, lastDate, remaining) : 0;
      return {
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { ...task, lastCompletedDate: lastDate, currentStreak: newStreak }
            : task,
        ),
        completions: remaining,
      };
    });
    setRecentCompletion(null);
    clearUndoTimer();
  }, []);

  const dismissRecentCompletion = useCallback(() => {
    setRecentCompletion(null);
    clearUndoTimer();
  }, []);

  const extendTarget = useCallback((taskId: string, newTarget: number) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === taskId
          ? { ...t, targetStreak: newTarget, milestoneAcknowledged: false }
          : t,
      ),
    }));
  }, []);

  const acknowledgeMilestone = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === taskId ? { ...t, milestoneAcknowledged: true } : t,
      ),
    }));
  }, []);

  const getTaskCompletions = useCallback((taskId: string) => {
    return state.completions.filter(c => c.taskId === taskId);
  }, [state.completions]);

  const activeTasks = state.tasks.filter(t => !t.archived);
  const archivedTasks = state.tasks.filter(t => t.archived);

  return {
    tasks: activeTasks,
    archivedTasks,
    allTasks: state.tasks,
    completions: state.completions,
    loaded,
    createTask,
    updateTask,
    deleteTask,
    clearAll,
    archiveTask,
    unarchiveTask,
    markComplete,
    undoTodayCompletion,
    recentCompletion,
    dismissRecentCompletion,
    extendTarget,
    acknowledgeMilestone,
    getTaskCompletions,
    exportData,
    importData,
  };
}
