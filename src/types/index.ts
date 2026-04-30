export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  color: number; // hue 0-359
  targetStreak: number;
  milestoneAcknowledged: boolean; // true after user acts on the milestone banner
  archived: boolean;
  reminderTime: string | null; // 'HH:MM' 24h, or null = no reminder
  reminderNotifId: string | null; // expo-notifications scheduled id
  freezeNotifIds: string[]; // one-shot notif ids active for today's freeze; cleared when not frozen
}

export interface Completion {
  id: string;
  taskId: string;
  date: string;
  completedAt: string;
}

export interface AppState {
  tasks: Task[];
  completions: Completion[];
}

export type HeatMapCell = {
  date: string;
  count: number;
  completedTaskIds: string[];
};
