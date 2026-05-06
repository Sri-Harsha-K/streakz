export type TodoPriority = 'low' | 'normal' | 'high';

export interface Todo {
  id: string;
  title: string;
  description: string;
  createdAt: string; // ISO
  dueDate: string | null; // 'YYYY-MM-DD' local or null
  completed: boolean;
  completedAt: string | null; // ISO when completed; null when uncompleted
  priority: TodoPriority;
}

export interface TodosState {
  todos: Todo[];
}
