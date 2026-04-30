import { Task, Completion } from '../types';
import { today, yesterday, daysBetween } from './date';

export function wasYesterdayCompleted(taskId: string, completions: Completion[]): boolean {
  const yest = yesterday();
  return completions.some(c => c.taskId === taskId && c.date === yest);
}

export function isTodayCompleted(taskId: string, completions: Completion[]): boolean {
  const t = today();
  return completions.some(c => c.taskId === taskId && c.date === t);
}

export function computeUpdatedStreak(task: Task, completions: Completion[]): Pick<Task, 'currentStreak' | 'longestStreak' | 'lastCompletedDate'> {
  const t = today();
  const yest = yesterday();

  if (task.lastCompletedDate === t) {
    return {
      currentStreak: task.currentStreak,
      longestStreak: task.longestStreak,
      lastCompletedDate: task.lastCompletedDate,
    };
  }

  const alreadyCompleted = completions.some(c => c.taskId === task.id && c.date === t);
  if (!alreadyCompleted) {
    return {
      currentStreak: task.currentStreak,
      longestStreak: task.longestStreak,
      lastCompletedDate: task.lastCompletedDate,
    };
  }

  let newStreak: number;
  if (task.lastCompletedDate === yest) {
    newStreak = task.currentStreak + 1;
  } else if (task.lastCompletedDate === null) {
    newStreak = 1;
  } else {
    const gap = daysBetween(task.lastCompletedDate, t);
    newStreak = gap === 1 ? task.currentStreak + 1 : 1;
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(task.longestStreak, newStreak),
    lastCompletedDate: t,
  };
}

export function checkAndResetStreak(task: Task): Pick<Task, 'currentStreak'> {
  if (task.lastCompletedDate === null) return { currentStreak: 0 };
  const t = today();
  if (task.lastCompletedDate === t) return { currentStreak: task.currentStreak };
  const gap = daysBetween(task.lastCompletedDate, t);
  if (gap > 1) return { currentStreak: 0 };
  return { currentStreak: task.currentStreak };
}

export function computeStreakAtDate(taskId: string, upToDate: string, completions: Completion[]): number {
  const taskCompletions = completions
    .filter(c => c.taskId === taskId && c.date <= upToDate)
    .map(c => c.date)
    .sort();

  if (taskCompletions.length === 0) return 0;

  let streak = 0;
  let prev: string | null = null;

  for (const date of taskCompletions) {
    if (prev === null) {
      streak = 1;
    } else {
      const gap = daysBetween(prev, date);
      streak = gap === 1 ? streak + 1 : 1;
    }
    prev = date;
  }

  const lastDate = taskCompletions[taskCompletions.length - 1];
  const gap = daysBetween(lastDate, upToDate);
  if (gap > 1) return 0;

  return streak;
}
