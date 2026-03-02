/**
 * Step 2: derivazione metriche da sessions.
 * Funzioni pure. Output: dati di dominio (date, numeri). Nessuna formattazione UI.
 * @see docs/CHART_METRICS_BRAINSTORM.md
 */

import type { GiantVersion } from '../domain/giant/types';
import type { SetTiming, WorkoutSession } from '../schema';

const GIANT_PROGRAM_ID = 'prog-the-giant';

/** metrics.version (number) -> GiantVersion (string) */
export function versionNumberToGiantVersion(n: number): GiantVersion {
  if (n === 1) return '1.0';
  if (n === 1.1) return '1.1';
  if (n === 1.2) return '1.2';
  if (n === 2) return '2.0';
  if (n === 3) return '3.0';
  return '1.0';
}

/** Ultima sessione The Giant completata, per derivare version/week/day della card ciclo */
export function getLatestGiantCycle(sessions: WorkoutSession[]): {
  version: GiantVersion;
  week: 1 | 2 | 3 | 4;
  day: 1 | 2 | 3;
} | undefined {
  const giant = sessions
    .filter(
      (s) =>
        s.programId === GIANT_PROGRAM_ID &&
        s.status === 'completed' &&
        s.metrics?.version != null
    )
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
  if (!giant) return undefined;
  const v = giant.metrics?.version ?? 1;
  const w = (giant.metrics?.week ?? 1) as 1 | 2 | 3 | 4;
  const d = (giant.metrics?.day ?? 1) as 1 | 2 | 3;
  return {
    version: versionNumberToGiantVersion(typeof v === 'number' ? v : 1),
    week: Math.min(4, Math.max(1, w)) as 1 | 2 | 3 | 4,
    day: (d >= 1 && d <= 3 ? d : 1) as 1 | 2 | 3,
  };
}

export interface DataPoint {
  date: Date;
  value: number;
}

export interface BubbleDataPoint {
  date: Date;
  reps: number;
  volume: number;
  weightKg: number;
}

export interface RestPerSetPoint {
  setIndex: number;
  restSec: number;
}

export interface Aggregates {
  sessionsCompleted: number;
  totalReps: number;
  totalSets: number;
  volumeLoad: number;
  bestReps: number;
  bestSets: number;
}

export interface AggregatesWithDelta extends Aggregates {
  deltaSessions?: number | null;
  deltaTotalReps?: number | null;
  deltaTotalSets?: number | null;
  deltaVolumeLoad?: number | null;
  deltaBestReps?: number | null;
  deltaBestSets?: number | null;
}

/** Sessioni negli ultimi N giorni (basato su startedAt) */
export function sessionsInLastNDays(
  sessions: WorkoutSession[],
  days: number
): WorkoutSession[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return sessions.filter((s) => new Date(s.startedAt).getTime() >= cutoff);
}

/** Delta percentuale: (current - previous) / previous * 100. Null se previous = 0. */
export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Versione programma come numero (es. "3.0" -> 3) per confronto con metrics.version */
function versionToNumber(v: string): number {
  return Number.parseFloat(v) || 0;
}

/**
 * Sessione precedente cronologicamente, stesso tipo (es. Giant 3.0).
 * Ritorna undefined se non esiste.
 */
export function getPreviousSessionOfSameType(
  sessions: WorkoutSession[],
  currentVersion: string,
  currentStartedAt: string
): WorkoutSession | undefined {
  const targetVersion = versionToNumber(currentVersion);
  const currentMs = new Date(currentStartedAt).getTime();

  return [...sessions]
    .filter(
      (s) =>
        s.status === 'completed' &&
        s.endedAt &&
        (s.metrics?.version ?? 0) === targetVersion &&
        new Date(s.startedAt).getTime() < currentMs
    )
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
}

/** Densità reps/min e sets/min per una sessione completata */
export function densityMetrics(session: {
  startedAt: string;
  endedAt: string;
  metrics: { totalReps?: number; setsCompleted?: number };
}): { repsPerMin: number; setsPerMin: number } {
  const durationMin = Math.max(
    0,
    (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
  );
  const reps = session.metrics?.totalReps ?? 0;
  const sets = session.metrics?.setsCompleted ?? 0;
  return {
    repsPerMin: durationMin > 0 ? Math.round((reps / durationMin) * 10) / 10 : 0,
    setsPerMin: durationMin > 0 ? Math.round((sets / durationMin) * 100) / 100 : 0,
  };
}

export interface SeriesOptions {
  limit?: number;
}

function sortAndSlice(
  sessions: WorkoutSession[],
  predicate: (s: WorkoutSession) => boolean,
  limit: number
): WorkoutSession[] {
  return [...sessions]
    .filter(predicate)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .slice(-limit);
}

/** Reps per sessione nel tempo */
export function repsOverTime(
  sessions: WorkoutSession[],
  opts: SeriesOptions = {}
): DataPoint[] {
  const limit = opts.limit ?? 14;
  const sorted = sortAndSlice(
    sessions,
    (s) => (s.metrics.totalReps ?? 0) > 0,
    limit
  );
  return sorted.map((s) => ({
    date: new Date(s.startedAt),
    value: s.metrics.totalReps ?? 0,
  }));
}

/** Sets per sessione nel tempo */
export function setsOverTime(
  sessions: WorkoutSession[],
  opts: SeriesOptions = {}
): DataPoint[] {
  const limit = opts.limit ?? 14;
  const sorted = sortAndSlice(
    sessions,
    (s) => (s.metrics.setsCompleted ?? 0) > 0,
    limit
  );
  return sorted.map((s) => ({
    date: new Date(s.startedAt),
    value: s.metrics.setsCompleted ?? 0,
  }));
}

/** Volume load (totalReps × weightKg) nel tempo */
export function volumeOverTime(
  sessions: WorkoutSession[],
  opts: SeriesOptions = {}
): DataPoint[] {
  const limit = opts.limit ?? 14;
  const sorted = sortAndSlice(
    sessions,
    (s) => (s.metrics.totalReps ?? 0) > 0 && (s.weightKg ?? 0) > 0,
    limit
  );
  return sorted.map((s) => ({
    date: new Date(s.startedAt),
    value: (s.metrics.totalReps ?? 0) * (s.weightKg ?? 0),
  }));
}

/** Densità reps/min nel tempo (solo sessioni completed con endedAt) */
export function densityOverTime(
  sessions: WorkoutSession[],
  opts: SeriesOptions = {}
): DataPoint[] {
  const limit = opts.limit ?? 14;
  const sorted = sortAndSlice(
    sessions,
    (s) => {
      if (s.status !== 'completed' || !s.endedAt) return false;
      const reps = s.metrics.totalReps ?? 0;
      if (reps <= 0) return false;
      const durationMin =
        (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()) / 60000;
      return durationMin > 0;
    },
    limit
  );
  return sorted.map((s) => {
    const reps = s.metrics.totalReps ?? 0;
    const durationMin =
      (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()) / 60000;
    return {
      date: new Date(s.startedAt),
      value: Math.round((reps / durationMin) * 10) / 10,
    };
  });
}

/** Dati per bubble chart: reps vs volume, size = peso */
export function bubbleData(
  sessions: WorkoutSession[],
  opts: SeriesOptions = {}
): BubbleDataPoint[] {
  const limit = opts.limit ?? 14;
  const sorted = sortAndSlice(
    sessions,
    (s) => (s.metrics.totalReps ?? 0) > 0 && (s.weightKg ?? 0) > 0,
    limit
  );
  return sorted.map((s) => {
    const reps = s.metrics.totalReps ?? 0;
    const w = s.weightKg ?? 0;
    return {
      date: new Date(s.startedAt),
      reps,
      volume: reps * w,
      weightKg: w,
    };
  });
}

/** Top N sessioni per reps (per pie chart) */
export function topSessionsByReps(
  sessions: WorkoutSession[],
  limit = 5
): DataPoint[] {
  return [...sessions]
    .filter((s) => (s.metrics.totalReps ?? 0) > 0)
    .sort((a, b) => (b.metrics.totalReps ?? 0) - (a.metrics.totalReps ?? 0))
    .slice(0, limit)
    .map((s) => ({
      date: new Date(s.startedAt),
      value: s.metrics.totalReps ?? 0,
    }));
}

/** Sets per sessione con split (per stacked bar: due stack per sessione) */
export function setsOverTimeSplit(
  sessions: WorkoutSession[],
  opts: SeriesOptions = {}
): { date: Date; valueA: number; valueB: number }[] {
  const points = setsOverTime(sessions, opts);
  return points.map((p) => {
    const a = Math.floor(p.value / 2);
    const b = p.value - a;
    return { date: p.date, valueA: a, valueB: b };
  });
}

/** Aggregati KPI */
export function aggregates(sessions: WorkoutSession[]): Aggregates {
  let totalReps = 0;
  let totalSets = 0;
  let volumeLoad = 0;
  let bestReps = 0;
  let bestSets = 0;

  for (const s of sessions) {
    const reps = s.metrics.totalReps ?? 0;
    const sets = s.metrics.setsCompleted ?? 0;
    const w = s.weightKg ?? 0;

    totalReps += reps;
    totalSets += sets;
    volumeLoad += reps * w;
    bestReps = Math.max(bestReps, reps);
    bestSets = Math.max(bestSets, sets);
  }

  const sessionsCompleted = sessions.filter((s) => s.status === 'completed').length;

  return {
    sessionsCompleted,
    totalReps,
    totalSets,
    volumeLoad,
    bestReps,
    bestSets,
  };
}

/** Aggregati con delta vs periodo precedente (periodDays = 14) */
export function aggregatesWithDelta(
  sessions: WorkoutSession[],
  periodDays = 14
): AggregatesWithDelta {
  const current = sessionsInLastNDays(sessions, periodDays);
  const previous = sessions.filter(
    (s) =>
      new Date(s.startedAt).getTime() >= Date.now() - periodDays * 2 * 24 * 60 * 60 * 1000 &&
      new Date(s.startedAt).getTime() < Date.now() - periodDays * 24 * 60 * 60 * 1000
  );

  const currAgg = aggregates(current);
  const prevAgg = aggregates(previous);

  return {
    ...currAgg,
    deltaSessions: deltaPercent(currAgg.sessionsCompleted, prevAgg.sessionsCompleted),
    deltaTotalReps: deltaPercent(currAgg.totalReps, prevAgg.totalReps),
    deltaTotalSets: deltaPercent(currAgg.totalSets, prevAgg.totalSets),
    deltaVolumeLoad: deltaPercent(currAgg.volumeLoad, prevAgg.volumeLoad),
    deltaBestReps: deltaPercent(currAgg.bestReps, prevAgg.bestReps),
    deltaBestSets: deltaPercent(currAgg.bestSets, prevAgg.bestSets),
  };
}

/** Insight testuale: ultime N sessioni, delta reps medie vs periodo precedente */
export function repsInsight(
  sessions: WorkoutSession[],
  lastN = 4,
  periodDays = 14
): string | null {
  const current = sessionsInLastNDays(sessions, periodDays);
  const previous = sessions.filter(
    (s) =>
      new Date(s.startedAt).getTime() >= Date.now() - periodDays * 2 * 24 * 60 * 60 * 1000 &&
      new Date(s.startedAt).getTime() < Date.now() - periodDays * 24 * 60 * 60 * 1000
  );

  const currReps = current.slice(-lastN).map((s) => s.metrics.totalReps ?? 0);
  const prevReps = previous.slice(-lastN).map((s) => s.metrics.totalReps ?? 0);

  if (currReps.length < 2 || prevReps.length === 0) return null;

  const currAvg = currReps.reduce((a, b) => a + b, 0) / currReps.length;
  const prevAvg = prevReps.reduce((a, b) => a + b, 0) / prevReps.length;
  const delta = deltaPercent(currAvg, prevAvg);
  if (delta === null) return null;

  const sign = delta >= 0 ? '+' : '';
  return `Ultime ${lastN} sessioni: ${sign}${delta}% reps medie.`;
}

/** Rest per set (solo se setEvents.length > 1) */
export function restPerSet(session: WorkoutSession): RestPerSetPoint[] {
  const events = session.setEvents ?? [];
  if (events.length < 2) return [];

  const result: RestPerSetPoint[] = [];
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1] as SetTiming;
    const curr = events[i] as SetTiming;
    const restSec =
      (new Date(curr.completedAt).getTime() - new Date(prev.completedAt).getTime()) / 1000;
    result.push({ setIndex: curr.setIndex, restSec });
  }
  return result;
}
