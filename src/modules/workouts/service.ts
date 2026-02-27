/**
 * Servizio logica allenamenti
 * Operazioni CRUD su sessioni, aggiornamento progressi
 */

import type { LocalDatabase, WorkoutSession, SyncMetadata } from '../../schema';
import type { CreateSessionInput } from './types';

function createSyncMeta(): SyncMetadata {
  return {
    updatedAt: new Date().toISOString(),
    version: 1,
    source: 'local',
    pendingSync: true,
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createSession(db: LocalDatabase, input: CreateSessionInput): WorkoutSession {
  const now = new Date().toISOString();
  const session: WorkoutSession = {
    id: generateId(),
    programId: input.programId,
    startedAt: input.startedAt ?? now,
    endedAt: now,
    weightKg: input.weightKg,
    metrics: input.metrics,
    notes: input.notes ?? null,
    calendarEventId: input.calendarEventId ?? null,
    calendarProvider: input.calendarProvider ?? null,
    _sync: createSyncMeta(),
  };
  return session;
}

export function addSession(db: LocalDatabase, session: WorkoutSession): LocalDatabase {
  return {
    ...db,
    sessions: [...db.sessions, session],
  };
}

export function updateSession(
  db: LocalDatabase,
  id: string,
  updates: Partial<WorkoutSession>
): LocalDatabase {
  const sessions = db.sessions.map((s) =>
    s.id === id
      ? {
          ...s,
          ...updates,
          _sync: {
            ...s._sync,
            updatedAt: new Date().toISOString(),
            version: s._sync.version + 1,
            pendingSync: true,
          },
        }
      : s
  );
  return { ...db, sessions };
}

export function deleteSession(db: LocalDatabase, id: string): LocalDatabase {
  return {
    ...db,
    sessions: db.sessions.filter((s) => s.id !== id),
  };
}
