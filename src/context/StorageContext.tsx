/**
 * Context per accesso al database locale
 * Fornisce db, setDb e operazioni di persistenza.
 * Richiede un profilo attivo (pier, luigi, test).
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LocalDatabase } from '../schema';
import type { ProfileId } from '../storage/profiles';
import { createLocalAdapter, loadOrCreateDb } from '../storage/localAdapter';

interface StorageContextValue {
  db: LocalDatabase | null;
  isLoading: boolean;
  setDb: React.Dispatch<React.SetStateAction<LocalDatabase | null>>;
  persist: (db: LocalDatabase) => Promise<void>;
  refresh: () => Promise<void>;
}

const StorageContext = createContext<StorageContextValue | null>(null);

interface StorageProviderProps {
  children: React.ReactNode;
  profile: ProfileId;
}

export function StorageProvider({ children, profile }: StorageProviderProps) {
  const [db, setDb] = useState<LocalDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    const data = await loadOrCreateDb(profile);
    setDb(data);
    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [profile]);

  const persist = async (data: LocalDatabase) => {
    const adapter = createLocalAdapter(profile);
    await adapter.write(data);
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
