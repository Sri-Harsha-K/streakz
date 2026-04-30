import React, { createContext, useContext } from 'react';
import { useStreakApp } from '../hooks/useStreakApp';

type AppData = ReturnType<typeof useStreakApp>;

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const data = useStreakApp();
  return <AppDataContext.Provider value={data}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
