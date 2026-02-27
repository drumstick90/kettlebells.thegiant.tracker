import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCHEMA_VERSION, type LocalDatabase } from '../schema';
import { DEFAULT_PROGRAMS } from '../schema/programs';
import type { StorageAdapter } from './types';
import { migrateDatabase } from './migration';
import { validateLocalDatabase } from './validation';

/** Seed data per dev: usato quando non esiste ancora nulla in AsyncStorage */
const SEED_DATA = require('../../data/seed-workouts.json') as unknown;

const DB_KEY = 'kettlebell-tracker:db';
const DB_BACKUP_KEY = 'kettlebell-tracker:db:backup';
const DB_TMP_KEY = 'kettlebell-tracker:db:tmp';

function nowIso(): string {
  return new Date().toISOString();
}

function createEmptyDb(): LocalDatabase {
  return {
    schemaVersion: SCHEMA_VERSION,
    programs: DEFAULT_PROGRAMS,
    sessions: [],
    progress: [],
    preferences: {
      weightUnit: 'kg',
      updatedAt: nowIso(),
    },
    lastBackupAt: null,
  };
}

async function writeAtomically(nextDb: LocalDatabase): Promise<void> {
  const payload = JSON.stringify(nextDb);
  await AsyncStorage.setItem(DB_TMP_KEY, payload);
  await AsyncStorage.setItem(DB_KEY, payload);
  await AsyncStorage.removeItem(DB_TMP_KEY);
}

export const localAdapter: StorageAdapter = {
  async read() {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (!raw) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    const validation = validateLocalDatabase(parsed);
    if (!validation.ok) {
      return null;
    }

    return validation.value;
  },

  async write(data) {
    const validation = validateLocalDatabase(data);
    if (!validation.ok) {
      throw new Error(`Refusing to persist invalid database: ${validation.error}`);
    }

    const currentRaw = await AsyncStorage.getItem(DB_KEY);
    if (currentRaw) {
      await AsyncStorage.setItem(DB_BACKUP_KEY, currentRaw);
    }

    await writeAtomically(validation.value);
  },

  async exists() {
    const raw = await AsyncStorage.getItem(DB_KEY);
    return raw !== null;
  },

  async clear() {
    await AsyncStorage.multiRemove([DB_KEY, DB_BACKUP_KEY, DB_TMP_KEY]);
  },
};

export async function loadOrCreateDb(): Promise<LocalDatabase> {
  const existing = await localAdapter.read();
  if (!existing) {
    const backupRaw = await AsyncStorage.getItem(DB_BACKUP_KEY);
    if (backupRaw) {
      try {
        const backupParsed = JSON.parse(backupRaw) as unknown;
        const backupValidation = validateLocalDatabase(backupParsed);
        if (backupValidation.ok) {
          const migrated = migrateDatabase(backupValidation.value);
          await localAdapter.write(migrated.db);
          return migrated.db;
        }
      } catch {
        // Ignore backup parse errors and create a fresh DB.
      }
    }

    // Prova seed per dev: data/seed-workouts.json ha sessioni di prova
    const seedValidation = validateLocalDatabase(SEED_DATA);
    if (seedValidation.ok) {
      const migrated = migrateDatabase(seedValidation.value);
      await localAdapter.write(migrated.db);
      return migrated.db;
    }

    const emptyDb = createEmptyDb();
    await localAdapter.write(emptyDb);
    return emptyDb;
  }

  const migrated = migrateDatabase(existing);
  if (migrated.migrated) {
    await localAdapter.write(migrated.db);
  }
  return migrated.db;
}

