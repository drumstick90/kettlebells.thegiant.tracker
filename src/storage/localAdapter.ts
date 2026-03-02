import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCHEMA_VERSION, type LocalDatabase } from '../schema';
import { DEFAULT_PROGRAMS } from '../schema/programs';
import type { ProfileId } from './profiles';
import type { StorageAdapter } from './types';
import { migrateDatabase } from './migration';
import { validateLocalDatabase } from './validation';

/** Seed data per dev: usato per profilo test e quando non esiste ancora nulla */
const SEED_DATA = require('../../data/seed-workouts.json') as unknown;

/** Chiave legacy (pre-profili): migrata al profilo test */
const LEGACY_DB_KEY = 'kettlebell-tracker:db';
const LEGACY_BACKUP_KEY = 'kettlebell-tracker:db:backup';
const LEGACY_TMP_KEY = 'kettlebell-tracker:db:tmp';

function dbKey(profile: ProfileId): string {
  return `kettlebell-tracker:db:${profile}`;
}

function dbBackupKey(profile: ProfileId): string {
  return `kettlebell-tracker:db:${profile}:backup`;
}

function dbTmpKey(profile: ProfileId): string {
  return `kettlebell-tracker:db:${profile}:tmp`;
}

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

/**
 * Migra i dati legacy (pre-profili) al profilo test.
 * Chiamata una tantum al primo avvio con il sistema profili.
 */
async function migrateLegacyToTest(): Promise<void> {
  const raw = await AsyncStorage.getItem(LEGACY_DB_KEY);
  if (!raw) return;

  const parsed: unknown = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();

  const validation = validateLocalDatabase(parsed);
  if (!validation.ok) return;

  const migrated = migrateDatabase(validation.value);
  await writeForProfile('test', migrated.db);
  await AsyncStorage.multiRemove([LEGACY_DB_KEY, LEGACY_BACKUP_KEY, LEGACY_TMP_KEY]);
}

async function writeForProfile(profile: ProfileId, nextDb: LocalDatabase): Promise<void> {
  const payload = JSON.stringify(nextDb);
  const tmp = dbTmpKey(profile);
  const main = dbKey(profile);
  await AsyncStorage.setItem(tmp, payload);
  await AsyncStorage.setItem(main, payload);
  await AsyncStorage.removeItem(tmp);
}

export function createLocalAdapter(profile: ProfileId): StorageAdapter {
  return {
    async read() {
      const raw = await AsyncStorage.getItem(dbKey(profile));
      if (!raw) return null;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return null;
      }

      const validation = validateLocalDatabase(parsed);
      if (!validation.ok) return null;
      return validation.value;
    },

    async write(data) {
      const validation = validateLocalDatabase(data);
      if (!validation.ok) {
        throw new Error(`Refusing to persist invalid database: ${validation.error}`);
      }

      const currentRaw = await AsyncStorage.getItem(dbKey(profile));
      if (currentRaw) {
        await AsyncStorage.setItem(dbBackupKey(profile), currentRaw);
      }

      await writeForProfile(profile, validation.value);
    },

    async exists() {
      const raw = await AsyncStorage.getItem(dbKey(profile));
      return raw !== null;
    },

    async clear() {
      await AsyncStorage.multiRemove([
        dbKey(profile),
        dbBackupKey(profile),
        dbTmpKey(profile),
      ]);
    },
  };
}

export async function loadOrCreateDb(profile: ProfileId): Promise<LocalDatabase> {
  await migrateLegacyToTest();

  const adapter = createLocalAdapter(profile);

  const trySeed = async (): Promise<LocalDatabase | null> => {
    const seedValidation = validateLocalDatabase(SEED_DATA);
    if (!seedValidation.ok) return null;
    const migrated = migrateDatabase(seedValidation.value);
    await adapter.write(migrated.db);
    return migrated.db;
  };

  const existing = await adapter.read();

  if (!existing) {
    const backupRaw = await AsyncStorage.getItem(dbBackupKey(profile));
    if (backupRaw) {
      try {
        const backupParsed = JSON.parse(backupRaw) as unknown;
        const backupValidation = validateLocalDatabase(backupParsed);
        if (backupValidation.ok) {
          const migrated = migrateDatabase(backupValidation.value);
          await adapter.write(migrated.db);
          return migrated.db;
        }
      } catch {
        /* ignore */
      }
    }

    const seeded = await trySeed();
    if (seeded) return seeded;

    const emptyDb = createEmptyDb();
    await adapter.write(emptyDb);
    return emptyDb;
  }

  // Dev: profilo test — se ci sono meno di 2 sessioni, usa il seed per far funzionare i chart
  if (profile === 'test' && existing.sessions.length < 2) {
    const seeded = await trySeed();
    if (seeded) return seeded;
  }

  const migrated = migrateDatabase(existing);
  if (migrated.migrated) {
    await adapter.write(migrated.db);
  }
  return migrated.db;
}
