export type GiantVersion = '1.0' | '1.1' | '1.2' | '2.0' | '3.0';

export type GiantDay = 1 | 2 | 3;

export type GiantPlanKind = 'fixed' | 'ladder';

export interface GiantFixedPlan {
  kind: 'fixed';
  repsPerSet: number;
  label: string;
}

export interface GiantLadderPlan {
  kind: 'ladder';
  ladder: number[];
  label: string;
}

export type GiantDayPlan = GiantFixedPlan | GiantLadderPlan;

export interface GiantSessionDraft {
  version: GiantVersion;
  day: GiantDay;
  week: 1 | 2 | 3 | 4;
  timerMinutes: 20 | 30;
  setsCompleted: number;
  weightKg: number;
  notes?: string;
}
