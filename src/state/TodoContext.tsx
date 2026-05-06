import React, { createContext, useContext } from 'react';
import { useTodos } from '../hooks/useTodos';

type TodoData = ReturnType<typeof useTodos>;

const TodoContext = createContext<TodoData | null>(null);

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const data = useTodos();
  return <TodoContext.Provider value={data}>{children}</TodoContext.Provider>;
}

export function useTodoData(): TodoData {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodoData must be used inside TodoProvider');
  return ctx;
}
