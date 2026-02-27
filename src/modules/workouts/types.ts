/**
 * Tipi per il modulo Workouts
 */

import type { WorkoutSession, ProgramTemplate } from '../../schema';

export interface CreateSessionInput {
  programId: string;
  weightKg: number;
  metrics: Record<string, number>;
  notes?: string;
  startedAt?: string;
  calendarEventId?: string;
  calendarProvider?: 'apple' | 'google';
}

export interface SessionWithProgram extends WorkoutSession {
  program?: ProgramTemplate;
}
