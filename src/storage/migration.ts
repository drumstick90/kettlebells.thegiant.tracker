import type { LocalDatabase } from '../schema';
import { SCHEMA_VERSION } from '../schema';
import { validateLocalDatabase } from './validation';

export interface MigrationOutcome {
  db: LocalDatabase;
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
}

/**
 * Lean migration hook:
 * - today: no-op forward migration
 * - still validates the result so broken migrations fail early
 */
export function migrateDatabase(db: LocalDatabase): MigrationOutcome {
  const fromVersion = db.schemaVersion;
  const nextDb: LocalDatabase =
    fromVersion === SCHEMA_VERSION
      ? db
      : {
          ...db,
          schemaVersion: SCHEMA_VERSION,
        };

  const validation = validateLocalDatabase(nextDb);
  if (!validation.ok) {
    throw new Error(`Migration produced invalid database: ${validation.error}`);
  }

  return {
    db: validation.value,
    migrated: fromVersion !== SCHEMA_VERSION,
    fromVersion,
    toVersion: SCHEMA_VERSION,
  };
}

