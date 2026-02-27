import type { GiantDay, GiantVersion } from '../domain/giant/types';
import type { GiantSetEvent } from '../features/giant/live/types';

export interface LiveSetupConfig {
  version: GiantVersion;
  week: 1 | 2 | 3 | 4;
  day: GiantDay;
  timerMinutes: 20 | 30;
  weightKg: number;
}

export interface SessionSummaryRouteData {
  config: LiveSetupConfig;
  events: GiantSetEvent[];
  startedAt: string;
  endedAt: string;
  endedBy: 'timer' | 'manual';
  totalReps: number;
  sessionId: string;
}

export type RootStackParamList = {
  Home: undefined;
  Setup: { prefill?: Partial<LiveSetupConfig> } | undefined;
  LiveWorkout: { config: LiveSetupConfig };
  SessionSummary: SessionSummaryRouteData;
  History: undefined;
  Progress: undefined;
  Settings: undefined;
  Credits: undefined;
};
