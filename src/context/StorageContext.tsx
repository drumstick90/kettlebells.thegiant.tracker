/**
 * Context per accesso al database locale
 * Fornisce db, setDb e operazioni di persistenza
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LocalDatabase } from '../schema';
import { loadOrCreateDb } from '../storage/localAdapter';
import { localAdapter } from '../storage/localAdapter';

interface StorageContextValue {
  db: LocalDatabase | null;
  isLoading: boolean;
  setDb: React.Dispatch<React.SetStateAction<LocalDatabase | null>>;
  persist: (db: LocalDatabase) => Promise<void>;
  refresh: () => Promise<void>;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<LocalDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    const data = await loadOrCreateDb();
    setDb(data);
    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const persist = async (data: LocalDatabase) => {
    await localAdapter.write(data);
    setDb(data);
  };

  const value: StorageContextValue = {
    db,
    isLoading,
    setDb,
    persist,
    refresh,
  };

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  return ctx;
}
