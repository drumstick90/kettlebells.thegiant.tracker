/**
 * Adapter per storage locale (AsyncStorage)
 * I dati sono serializzati come JSON. In futuro si può passare a SQLite/MMKV
 * senza cambiare l'interfaccia StorageAdapter.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from './types';
import type { LocalDatabase } from '../schema';
import { SCHEMA_VERSION } from '../schema';
import { DEFAULT_PROGRAMS } from '../schema/programs';

const STORAGE_KEY = '@kettlebell_tracker_db';

const createEmptyDb = (): LocalDatabase => ({
  schemaVersion: SCHEMA_VERSION,
  programs: DEFAULT_PROGRAMS,
  sessions: [],
  progress: [],
  preferences: {
    weightUnit: 'kg',
    updatedAt: new Date().toISOString(),
  },
});

export const localAdapter: StorageAdapter = {
  async read(): Promise<LocalDatabase | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as LocalDatabase;
    } catch {
      return null;
    }
  },

  async write(data: LocalDatabase): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async exists(): Promise<boolean> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw !== null;
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};

/** Inizializza o carica il DB. Restituisce sempre un DB valido. */
export async function loadOrCreateDb(): Promise<LocalDatabase> {
  const existing = await localAdapter.read();
  if (existing) return existing;
  const fresh = createEmptyDb();
  await localAdapter.write(fresh);
  return fresh;
}
