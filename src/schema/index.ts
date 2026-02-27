/**
 * Schema agnostico per Kettlebell Tracker
 * Compatibile con storage locale e futuro sync server.
 * I dati locali dei beta tester saranno preservati in fase di migrazione.
 */

// ─── Identificatori ─────────────────────────────────────────────────────────
// UUID v4 o nanoid per garantire unicità locale e in sync
export type EntityId = string;

// Origine del dato: locale o server (per merge futuro)
export type DataSource = 'local' | 'server';

// ─── Metadata di sync (per versioni future) ──────────────────────────────────
export interface SyncMetadata {
  /** Quando il record è stato creato/modificato localmente */
  updatedAt: string; // ISO 8601
  /** Versione per conflict resolution (incrementa ad ogni modifica) */
  version: number;
  /** Origine: locale fino al primo sync, poi server */
  source?: DataSource;
  /** ID server (popolato dopo sync, null se mai sincronizzato) */
  serverId?: string | null;
  /** Flag per merge: true se modificato localmente e non ancora sincronizzato */
  pendingSync?: boolean;
}

// ─── Tipi di programma kettlebell ────────────────────────────────────────────
export type ProgramType =
  | 'the_giant'      // Geoff Neupert
  | 'simple_sinister' // Pavel
  | 'dry_fighting_weight'
  | 'custom';

export interface ProgramTemplate {
  id: EntityId;
  type: ProgramType;
  name: string;
  /** Struttura del workout (es. "10x10 C&P", "5x5 snatch") */
  structure: string;
  /** Unità di misura: reps, tempo, ecc. */
  unit: 'reps' | 'seconds' | 'minutes' | 'rounds';
  /** Peso kettlebell in kg (opzionale, può variare per sessione) */
  defaultWeightKg?: number;
}

// ─── Timestamp per singola serie (ladder/fixed) ───────────────────────────────
/** Timestamp di completamento di ogni singola serie, per analisi intervalli/rest */
export interface SetTiming {
  setIndex: number;
  /** Quando la serie è stata completata (ISO 8601) */
  completedAt: string;
  repsTarget: number;
  /** Ciclo ladder (1, 2, 3...) — null per programmi fixed */
  ladderCycle?: number | null;
  /** Step dentro la ladder (1, 2, 3...) — null per programmi fixed */
  ladderStep?: number | null;
}

export type WorkoutStatus = 'in_progress' | 'completed' | 'aborted';

// ─── Sessione di allenamento ─────────────────────────────────────────────────
export interface WorkoutSession {
  id: EntityId;
  programId: EntityId;
  /** Stato della sessione */
  status?: WorkoutStatus;
  /** Data/ora inizio (ISO 8601) */
  startedAt: string;
  /** Data/ora fine (ISO 8601), opzionale se in corso */
  endedAt?: string | null;
  /** Peso usato in kg */
  weightKg: number;
  /** Metriche specifiche del programma (es. reps totali, tempo, round) */
  metrics: Record<string, number>;
  /** Timestamp di ogni singola serie (per analisi intervalli, rest, densità) */
  setEvents: SetTiming[];
  /** Note libere */
  notes?: string | null;
  /** Riferimento evento calendario esterno (Apple/Google) */
  calendarEventId?: string | null;
  /** Tipo calendario da cui proviene l'evento */
  calendarProvider?: 'apple' | 'google' | null;
  _sync: SyncMetadata;
}

// ─── Progresso aggregato (derivato, cache locale) ──────────────────────────────
export interface ProgressSnapshot {
  id: EntityId;
  programId: EntityId;
  /** Data del snapshot */
  date: string; // YYYY-MM-DD
  /** Valore principale (es. reps totali, tempo) */
  primaryValue: number;
  /** Metrica secondaria se applicabile */
  secondaryValue?: number;
  /** Peso usato */
  weightKg: number;
  _sync: SyncMetadata;
}

// ─── Configurazione utente (preferenze, collegamenti calendario) ─────────────
export interface UserPreferences {
  /** Unità preferita: kg o lb */
  weightUnit: 'kg' | 'lb';
  /** Calendario collegato (ID) */
  linkedCalendarId?: string | null;
  /** Provider calendario */
  calendarProvider?: 'apple' | 'google' | null;
  /** Ultima modifica */
  updatedAt: string;
}

// ─── Struttura database locale (schema v1) ───────────────────────────────────
export interface LocalDatabase {
  schemaVersion: number;
  programs: ProgramTemplate[];
  sessions: WorkoutSession[];
  progress: ProgressSnapshot[];
  preferences: UserPreferences;
  /** Timestamp ultimo export/backup per migrazione */
  lastBackupAt?: string | null;
}

// ─── Costanti schema ─────────────────────────────────────────────────────────
export const SCHEMA_VERSION = 1;
