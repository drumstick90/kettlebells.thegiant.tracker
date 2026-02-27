import type { LocalDatabase, WorkoutSession } from '../../../schema';
import type { GiantDayPlan } from '../../../domain/giant/types';
import { addSession, createSession } from '../../../modules/workouts/service';
import type { FinishLiveSessionInput, GiantSetEvent, GiantSetTarget } from './types';

const PROGRAM_ID = 'prog-the-giant';
const LIVE_EVENT_PREFIX = 'LIVE_EVENT_LOG:';

export function formatElapsedLabelFromDeciseconds(totalDeciseconds: number): string {
  const clamped = Math.max(0, totalDeciseconds);
  const minutes = Math.floor(clamped / 600);
  const seconds = Math.floor((clamped % 600) / 10);
  const deciseconds = clamped % 10;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${deciseconds}`;
}

export function getSetTarget(plan: GiantDayPlan, setIndex: number): GiantSetTarget {
  if (plan.kind === 'fixed') {
    return {
      repsTarget: plan.repsPerSet,
      ladderCycle: null,
      ladderStep: null,
    };
  }

  const ladderStep = (setIndex - 1) % plan.ladder.length;
  const ladderCycle = Math.floor((setIndex - 1) / plan.ladder.length) + 1;

  return {
    repsTarget: plan.ladder[ladderStep],
    ladderCycle,
    ladderStep: ladderStep + 1,
  };
}

export function appendSetEvent(
  events: GiantSetEvent[],
  plan: GiantDayPlan,
  elapsedDeciseconds: number
): GiantSetEvent[] {
  const nextSetIndex = events.length + 1;
  const target = getSetTarget(plan, nextSetIndex);

  return [
    ...events,
    {
      setIndex: nextSetIndex,
      elapsedDeciseconds,
      elapsedLabel: formatElapsedLabelFromDeciseconds(elapsedDeciseconds),
      repsTarget: target.repsTarget,
      ladderCycle: target.ladderCycle,
      ladderStep: target.ladderStep,
    },
  ];
}

export function undoLastSetEvent(events: GiantSetEvent[]): GiantSetEvent[] {
  if (events.length === 0) {
    return events;
  }

  return events.slice(0, -1);
}

export function buildLiveNotes(events: GiantSetEvent[], existingNotes?: string): string | undefined {
  const payload = JSON.stringify(events);
  const liveBlock = `${LIVE_EVENT_PREFIX}${payload}`;

  if (existingNotes && existingNotes.trim().length > 0) {
    return `${existingNotes.trim()}\n\n${liveBlock}`;
  }

  return liveBlock;
}

export function calculateTotalRepsFromEvents(events: GiantSetEvent[]): number {
  return events.reduce((acc, event) => acc + event.repsTarget, 0);
}

export function finishGiantLiveSession(
  db: LocalDatabase,
  input: FinishLiveSessionInput
): { db: LocalDatabase; session: WorkoutSession; totalReps: number } {
  const totalReps = calculateTotalRepsFromEvents(input.events);
  const setsCompleted = input.events.length;
  const planRepsPerSet = input.plan.kind === 'fixed' ? input.plan.repsPerSet : 0;

  const session = createSession(db, {
    programId: PROGRAM_ID,
    startedAt: input.startedAt,
    weightKg: input.weightKg,
    notes: buildLiveNotes(input.events, input.existingNotes),
    metrics: {
      version: input.versionNumber,
      week: input.week,
      day: input.day,
      timerMinutes: input.timerMinutes,
      setsCompleted,
      totalReps,
      repsPerSet: planRepsPerSet,
      endedByTimer: input.endedBy === 'timer' ? 1 : 0,
      endedManually: input.endedBy === 'manual' ? 1 : 0,
    },
  });

  const endedSession: WorkoutSession = {
    ...session,
    endedAt: input.endedAt,
  };

  return {
    db: addSession(db, endedSession),
    session: endedSession,
    totalReps,
  };
}
