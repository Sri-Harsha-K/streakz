import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Todo, TodoPriority, TodosState } from '../types/todo';

const STORAGE_KEY = 'streakapp_todos_v1';
const EMPTY: TodosState = { todos: [] };
export const MAX_ACTIVE_TODOS = 100;

const PRIORITIES: readonly TodoPriority[] = ['low', 'normal', 'high'];

function isPriority(value: unknown): value is TodoPriority {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value);
}

function migrateTodo(raw: Record<string, unknown>): Todo {
  const completed = typeof raw.completed === 'boolean' ? raw.completed : false;
  return {
    id: raw.id as string,
    title: (raw.title as string) ?? '',
    description: (raw.description as string) ?? '',
    createdAt: (raw.createdAt as string) ?? new Date().toISOString(),
    dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : null,
    completed,
    completedAt:
      typeof raw.completedAt === 'string'
        ? raw.completedAt
        : completed
          ? new Date().toISOString()
          : null,
    priority: isPriority(raw.priority) ? raw.priority : 'normal',
  };
}

async function loadState(): Promise<TodosState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as { todos?: Record<string, unknown>[] };
    return {
      todos: Array.isArray(parsed.todos) ? parsed.todos.map(migrateTodo) : [],
    };
  } catch {
    return EMPTY;
  }
}

async function saveState(state: TodosState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uuid(): string {
  return Crypto.randomUUID();
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: TodoPriority;
}

export type UpdateTodoPatch = Partial<Pick<Todo, 'title' | 'description' | 'dueDate' | 'priority'>>;

export function useTodos() {
  const [state, setState] = useState<TodosState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);

  // Initial async load
  useEffect(() => {
    let cancelled = false;
    loadState().then((s) => {
      if (cancelled) return;
      setState(s);
      loadedRef.current = true;
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on change, but only after first load completes (avoid wiping disk)
  useEffect(() => {
    if (!loadedRef.current) return;
    saveState(state).catch(() => {});
  }, [state]);

  const createTodo = useCallback((input: CreateTodoInput) => {
    setState((prev) => {
      const activeCount = prev.todos.filter((t) => !t.completed).length;
      if (activeCount >= MAX_ACTIVE_TODOS) return prev;
      const todo: Todo = {
        id: uuid(),
        title: input.title,
        description: input.description ?? '',
        createdAt: new Date().toISOString(),
        dueDate: input.dueDate ?? null,
        completed: false,
        completedAt: null,
        priority: input.priority ?? 'normal',
      };
      return { ...prev, todos: [...prev.todos, todo] };
    });
  }, []);

  const updateTodo = useCallback((todoId: string, patch: UpdateTodoPatch) => {
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === todoId ? { ...t, ...patch } : t)),
    }));
  }, []);

  const toggleComplete = useCallback((todoId: string) => {
    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => {
        if (t.id !== todoId) return t;
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        };
      }),
    }));
  }, []);

  const deleteTodo = useCallback((todoId: string) => {
    setState((prev) => ({ ...prev, todos: prev.todos.filter((t) => t.id !== todoId) }));
  }, []);

  const clearAllTodos = useCallback(() => {
    setState({ todos: [] });
  }, []);

  const activeTodos = state.todos.filter((t) => !t.completed);
  const completedTodos = state.todos.filter((t) => t.completed);

  return {
    todos: state.todos,
    activeTodos,
    completedTodos,
    loaded,
    createTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
    clearAllTodos,
  };
}
