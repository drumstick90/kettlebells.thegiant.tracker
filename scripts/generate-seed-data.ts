/**
 * Genera dati seed realistici: 3-4 settimane di workout The Giant
 * Include 2 sessioni interrotte (senza endedAt)
 *
 * ⚠️ RIMUOVERE prima di produzione: script e data/seed-workouts.json sono solo per dev/test
 */

import type { LocalDatabase, WorkoutSession, SetTiming } from '../src/schema';
import { SCHEMA_VERSION } from '../src/schema';
import { DEFAULT_PROGRAMS } from '../src/schema/programs';
import { validateLocalDatabase } from '../src/storage/validation';
import { estimateTotalReps } from '../src/domain/giant/rules';
import type { GiantDayPlan, GiantVersion } from '../src/domain/giant/types';
import { getGiantDayPlan } from '../src/domain/giant/rules';

const PROGRAM_ID = 'prog-the-giant';

type GiantDay = 1 | 2 | 3;

function createSyncMeta() {
  return {
    updatedAt: new Date().toISOString(),
    version: 1,
    source: 'local' as const,
    pendingSync: true,
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

/** Genera setEvents con rest realistici (60-120 sec, crescente con affaticamento) */
function generateSetEvents(
  startedAt: string,
  plan: GiantDayPlan,
  setsCompleted: number
): SetTiming[] {
  const events: SetTiming[] = [];
  let currentMs = new Date(startedAt).getTime();

  for (let i = 0; i < setsCompleted; i++) {
    const setIndex = i + 1;
    const ladderStep = plan.kind === 'ladder' ? ((setIndex - 1) % plan.ladder.length) : null;
    const ladderCycle = plan.kind === 'ladder' ? Math.floor((setIndex - 1) / plan.ladder.length) + 1 : null;
    const repsTarget = plan.kind === 'fixed' ? plan.repsPerSet : plan.ladder[ladderStep!];

    events.push({
      setIndex,
      completedAt: new Date(currentMs).toISOString(),
      repsTarget,
      ladderCycle: ladderCycle ?? null,
      ladderStep: ladderStep !== null ? ladderStep + 1 : null,
    });

    // Rest: 55-75 sec base + 2-4 sec extra per set (affaticamento)
    const restSec = 55 + Math.floor(Math.random() * 20) + (i * 3);
    currentMs += restSec * 1000;
  }

  return events;
}

interface SessionSpec {
  date: string; // YYYY-MM-DD
  hour: number;
  minute: number;
  version: GiantVersion;
  day: GiantDay;
  week: 1 | 2 | 3 | 4;
  timerMinutes: 20 | 30;
  setsCompleted: number;
  weightKg: number;
  endedBy: 'timer' | 'manual';
  /** true = sessione interrotta, senza endedAt */
  interrupted?: boolean;
  notes?: string;
}

const SESSION_SPECS: SessionSpec[] = [
  // Week 1 - Giant 1.0, 24kg
  { date: '2025-02-03', hour: 7, minute: 15, version: '1.0', day: 1, week: 1, timerMinutes: 30, setsCompleted: 8, weightKg: 24, endedBy: 'timer' },
  { date: '2025-02-05', hour: 18, minute: 30, version: '1.0', day: 2, week: 1, timerMinutes: 30, setsCompleted: 7, weightKg: 24, endedBy: 'manual' },
  { date: '2025-02-07', hour: 7, minute: 0, version: '1.0', day: 3, week: 1, timerMinutes: 20, setsCompleted: 6, weightKg: 24, endedBy: 'timer' },
  // Week 2 - Giant 1.0, progressione
  { date: '2025-02-10', hour: 7, minute: 20, version: '1.0', day: 1, week: 2, timerMinutes: 30, setsCompleted: 9, weightKg: 24, endedBy: 'timer' },
  { date: '2025-02-12', hour: 18, minute: 45, version: '1.0', day: 2, week: 2, timerMinutes: 30, setsCompleted: 8, weightKg: 24, endedBy: 'timer' },
  { date: '2025-02-14', hour: 8, minute: 0, version: '1.0', day: 3, week: 2, timerMinutes: 20, setsCompleted: 5, weightKg: 24, endedBy: 'manual', interrupted: true, notes: 'Mal di testa, fermato prima del timer' },
  // Week 3 - passa a Giant 2.0 (ladder)
  { date: '2025-02-17', hour: 7, minute: 10, version: '2.0', day: 1, week: 1, timerMinutes: 30, setsCompleted: 9, weightKg: 24, endedBy: 'timer' }, // ladder 3,4,5 x3
  { date: '2025-02-19', hour: 18, minute: 30, version: '2.0', day: 2, week: 1, timerMinutes: 30, setsCompleted: 6, weightKg: 24, endedBy: 'manual', interrupted: true, notes: 'Interrotto per impegno improvviso' }, // ladder 3,5,7 x2
  { date: '2025-02-21', hour: 7, minute: 30, version: '2.0', day: 3, week: 1, timerMinutes: 30, setsCompleted: 12, weightKg: 24, endedBy: 'timer' }, // ladder 4,6,8 x4
  // Week 4 - mix, prova 20kg un giorno
  { date: '2025-02-24', hour: 7, minute: 0, version: '2.0', day: 1, week: 2, timerMinutes: 30, setsCompleted: 12, weightKg: 24, endedBy: 'timer' },
  { date: '2025-02-26', hour: 18, minute: 15, version: '2.0', day: 2, week: 2, timerMinutes: 30, setsCompleted: 9, weightKg: 20, endedBy: 'timer', notes: 'Giorno leggero, 20kg per recupero' },
];

function buildSession(spec: SessionSpec): WorkoutSession {
  const plan = getGiantDayPlan(spec.version, spec.day);
  const totalReps = estimateTotalReps(plan, spec.setsCompleted);
  const repsPerSet = plan.kind === 'fixed' ? plan.repsPerSet : 0;

  const startedAt = `${spec.date}T${String(spec.hour).padStart(2, '0')}:${String(spec.minute).padStart(2, '0')}:00.000Z`;
  const setEvents = generateSetEvents(startedAt, plan, spec.setsCompleted);
  const lastSetCompletedAt = setEvents[setEvents.length - 1]?.completedAt ?? startedAt;
  const durationMin = (new Date(lastSetCompletedAt).getTime() - new Date(startedAt).getTime()) / 60000;

  const session: WorkoutSession = {
    id: generateId(),
    programId: PROGRAM_ID,
    startedAt,
    endedAt: spec.interrupted ? null : addMinutes(startedAt, Math.ceil(durationMin) + 1),
    weightKg: spec.weightKg,
    metrics: {
      version: parseFloat(spec.version),
      week: spec.week,
      day: spec.day,
      timerMinutes: spec.timerMinutes,
      setsCompleted: spec.setsCompleted,
      totalReps,
      repsPerSet,
      endedByTimer: spec.endedBy === 'timer' && !spec.interrupted ? 1 : 0,
      endedManually: spec.endedBy === 'manual' || spec.interrupted ? 1 : 0,
    },
    setEvents,
    notes: spec.notes ?? null,
    calendarEventId: null,
    calendarProvider: null,
    _sync: createSyncMeta(),
  };

  return session;
}

function generateSeedDb(): LocalDatabase {
  const sessions = SESSION_SPECS.map(buildSession);

  return {
    schemaVersion: SCHEMA_VERSION,
    programs: DEFAULT_PROGRAMS,
    sessions,
    progress: [],
    preferences: {
      weightUnit: 'kg',
      updatedAt: new Date().toISOString(),
    },
  };
}

import * as fs from 'fs';
import * as path from 'path';

const db = generateSeedDb();
const validation = validateLocalDatabase(db);
if (!validation.ok) {
  throw new Error(`Generated seed database is invalid: ${validation.error}`);
}

const outPath = path.join(__dirname, '..', 'data', 'seed-workouts.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(validation.value, null, 2), 'utf-8');
console.log(`Written to ${outPath}`);
