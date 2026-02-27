import type { GiantDay, GiantDayPlan, GiantVersion } from './types';

const GIANT_DAY_PLANS = {
  '1.0': {
    1: { kind: 'fixed', repsPerSet: 5, label: 'Sets of 5' },
    2: { kind: 'fixed', repsPerSet: 6, label: 'Sets of 6' },
    3: { kind: 'fixed', repsPerSet: 4, label: 'Sets of 4' },
  },
  '1.1': {
    1: { kind: 'fixed', repsPerSet: 6, label: 'Sets of 6' },
    2: { kind: 'fixed', repsPerSet: 8, label: 'Sets of 8' },
    3: { kind: 'fixed', repsPerSet: 7, label: 'Sets of 7' },
  },
  '1.2': {
    1: { kind: 'fixed', repsPerSet: 7, label: 'Sets of 7' },
    2: { kind: 'fixed', repsPerSet: 9, label: 'Sets of 9' },
    3: { kind: 'fixed', repsPerSet: 8, label: 'Sets of 8' },
  },
  '2.0': {
    1: { kind: 'ladder', ladder: [3, 4, 5], label: 'Ladder 3,4,5' },
    2: { kind: 'ladder', ladder: [3, 5, 7], label: 'Ladder 3,5,7' },
    3: { kind: 'ladder', ladder: [4, 6, 8], label: 'Ladder 4,6,8' },
  },
  '3.0': {
    1: { kind: 'fixed', repsPerSet: 2, label: 'Sets of 2' },
    2: { kind: 'fixed', repsPerSet: 3, label: 'Sets of 3' },
    3: { kind: 'fixed', repsPerSet: 1, label: 'Sets of 1' },
  },
} as const satisfies Record<GiantVersion, Record<GiantDay, GiantDayPlan>>;

export function getGiantDayPlan(version: GiantVersion, day: GiantDay): GiantDayPlan {
  return GIANT_DAY_PLANS[version][day];
}

export function getRmType(version: GiantVersion): '5RM' | '10RM' {
  return version === '3.0' ? '5RM' : '10RM';
}

export function estimateTotalReps(plan: GiantDayPlan, setsCompleted: number): number {
  if (plan.kind === 'fixed') {
    return plan.repsPerSet * setsCompleted;
  }

  if (setsCompleted <= 0) {
    return 0;
  }

  const ladderTotal = plan.ladder.reduce((acc, reps) => acc + reps, 0);
  const fullLadders = Math.floor(setsCompleted / plan.ladder.length);
  const partialSteps = setsCompleted % plan.ladder.length;
  const partialTotal = plan.ladder.slice(0, partialSteps).reduce((acc, reps) => acc + reps, 0);

  return fullLadders * ladderTotal + partialTotal;
}
