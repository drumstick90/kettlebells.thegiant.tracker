import type { GiantDayPlan } from '../../../domain/giant/types';

export interface GiantSetEvent {
  setIndex: number;
  elapsedDeciseconds: number;
  elapsedLabel: string;
  repsTarget: number;
  ladderCycle: number | null;
  ladderStep: number | null;
}

export interface GiantSetTarget {
  repsTarget: number;
  ladderCycle: number | null;
  ladderStep: number | null;
}

export interface FinishLiveSessionInput {
  startedAt: string;
  endedAt: string;
  endedBy: 'timer' | 'manual';
  events: GiantSetEvent[];
  plan: GiantDayPlan;
  versionNumber: number;
  week: number;
  day: number;
  timerMinutes: number;
  weightKg: number;
  existingNotes?: string;
}
