/**
 * Migrazioni schema
 * Quando si aggiunge il sync server, i dati locali vengono:
 * 1. Esportati (backup)
 * 2. Migrati al nuovo schema se necessario
 * 3. Inviati al server al primo login
 * 4. Merge con dati server (last-write-wins o custom resolution)
 */

import type { LocalDatabase } from '../schema';
import type { MigrationResult } from './types';

type Migrator = (db: LocalDatabase) => LocalDatabase;

const migrations: Record<number, Migrator> = {
  // Esempio: 2: (db) => ({ ...db, schemaVersion: 2, newField: [] }),
};

export function migrate(db: LocalDatabase): MigrationResult {
  let current = db;
  let fromVersion = db.schemaVersion;
  const targetVersion = 1; // SCHEMA_VERSION attuale

  if (fromVersion >= targetVersion) {
    return { success: true, fromVersion, toVersion: fromVersion };
  }

  try {
    for (let v = fromVersion + 1; v <= targetVersion; v++) {
      const migrator = migrations[v];
      if (migrator) {
        current = migrator(current);
        current.schemaVersion = v;
      }
    }
    return {
      success: true,
      fromVersion,
      toVersion: targetVersion,
      migratedRecords:
        current.sessions.length + current.progress.length,
    };
  } catch (err) {
    return {
      success: false,
      fromVersion,
      toVersion: fromVersion,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Export per backup prima di migrazione/login */
export function exportForBackup(db: LocalDatabase): string {
  return JSON.stringify({
    ...db,
    lastBackupAt: new Date().toISOString(),
  });
}
