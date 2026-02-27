import type { LocalDatabase, WorkoutSession } from '../../schema';
import type { GiantSessionDraft } from '../../domain/giant/types';
import { estimateTotalReps, getGiantDayPlan } from '../../domain/giant/rules';
import { addSession, createSession } from '../../modules/workouts/service';

const PROGRAM_ID = 'prog-the-giant';

export interface LogGiantSessionResult {
  db: LocalDatabase;
  session: WorkoutSession;
}

export function logGiantSession(db: LocalDatabase, draft: GiantSessionDraft): LogGiantSessionResult {
  const plan = getGiantDayPlan(draft.version, draft.day);
  const totalReps = estimateTotalReps(plan, draft.setsCompleted);

  const session = createSession(db, {
    programId: PROGRAM_ID,
    weightKg: draft.weightKg,
    notes: draft.notes,
    metrics: {
      version: Number(draft.version),
      week: draft.week,
      day: draft.day,
      timerMinutes: draft.timerMinutes,
      setsCompleted: draft.setsCompleted,
      totalReps,
      repsPerSet: plan.kind === 'fixed' ? plan.repsPerSet : 0,
    },
  });

  return {
    db: addSession(db, session),
    session,
  };
}
