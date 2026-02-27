/**
 * Tipi per il modulo Workouts
 */

import type { WorkoutSession, ProgramTemplate, SetTiming } from '../../schema';

export interface CreateSessionInput {
  programId: string;
  weightKg: number;
  metrics: Record<string, number>;
  notes?: string;
  startedAt?: string;
  /** Timestamp di ogni serie (per sessioni live con tracking per-set) */
  setEvents?: SetTiming[];
  calendarEventId?: string;
  calendarProvider?: 'apple' | 'google';
}

export interface SessionWithProgram extends WorkoutSession {
  program?: ProgramTemplate;
}
