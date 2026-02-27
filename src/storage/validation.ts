import type {
  LocalDatabase,
  ProgramTemplate,
  ProgressSnapshot,
  SetTiming,
  SyncMetadata,
  WorkoutSession,
} from '../schema';

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

function isNullableString(value: unknown): value is string | null | undefined {
  return value === null || value === undefined || typeof value === 'string';
}

function isSyncMetadata(value: unknown): value is SyncMetadata {
  if (!isObject(value) || !isString(value.updatedAt) || !isNumber(value.version)) {
    return false;
  }

  if (value.source !== undefined && value.source !== 'local' && value.source !== 'server') {
    return false;
  }

  if (!isNullableString(value.serverId)) {
    return false;
  }

  return value.pendingSync === undefined || typeof value.pendingSync === 'boolean';
}

function isProgramTemplate(value: unknown): value is ProgramTemplate {
  if (!isObject(value)) return false;
  if (!isString(value.id) || !isString(value.name) || !isString(value.structure)) return false;
  if (!['the_giant', 'simple_sinister', 'dry_fighting_weight', 'custom'].includes(String(value.type))) {
    return false;
  }
  if (!['reps', 'seconds', 'minutes', 'rounds'].includes(String(value.unit))) {
    return false;
  }

  return value.defaultWeightKg === undefined || isNonNegativeNumber(value.defaultWeightKg);
}

function isSetTiming(value: unknown): value is SetTiming {
  if (!isObject(value)) return false;
  if (!isNumber(value.setIndex) || !isString(value.completedAt) || !isNumber(value.repsTarget)) {
    return false;
  }

  const cycleValid = value.ladderCycle === undefined || value.ladderCycle === null || isNumber(value.ladderCycle);
  const stepValid = value.ladderStep === undefined || value.ladderStep === null || isNumber(value.ladderStep);
  return cycleValid && stepValid;
}

function isMetricsRecord(value: unknown): value is Record<string, number | null> {
  if (!isObject(value)) return false;
  return Object.values(value).every((metricValue) => metricValue === null || isNumber(metricValue));
}

function validateSession(
  value: unknown,
  validProgramIds: Set<string>
): ValidationResult<WorkoutSession> {
  if (!isObject(value)) return { ok: false, error: 'session is not an object' };
  if (!isString(value.id) || !isString(value.programId) || !isString(value.startedAt)) {
    return { ok: false, error: 'session missing mandatory identifiers/timestamps' };
  }
  if (!validProgramIds.has(value.programId)) {
    return { ok: false, error: `session.programId not found: ${value.programId}` };
  }
  if (
    !isNonNegativeNumber(value.weightKg) ||
    !isMetricsRecord(value.metrics) ||
    !isSyncMetadata(value._sync)
  ) {
    return { ok: false, error: 'session has invalid weight/metrics/_sync' };
  }

  if (!isNullableString(value.endedAt)) return { ok: false, error: 'session.endedAt is invalid' };
  if (value.notes !== undefined && value.notes !== null && !isString(value.notes)) {
    return { ok: false, error: 'session.notes is invalid' };
  }
  if (!isNullableString(value.calendarEventId)) {
    return { ok: false, error: 'session.calendarEventId is invalid' };
  }

  const provider = value.calendarProvider;
  if (
    provider !== undefined &&
    provider !== null &&
    provider !== 'apple' &&
    provider !== 'google'
  ) {
    return { ok: false, error: 'session.calendarProvider is invalid' };
  }

  const status = value.status;
  if (
    status !== undefined &&
    status !== 'in_progress' &&
    status !== 'completed' &&
    status !== 'aborted'
  ) {
    return { ok: false, error: 'session.status is invalid' };
  }

  if (!Array.isArray(value.setEvents) || !value.setEvents.every(isSetTiming)) {
    return { ok: false, error: 'session.setEvents must be an array of SetTiming' };
  }

  const metrics = value.metrics;
  const setsCompleted = metrics.setsCompleted;
  const totalReps = metrics.totalReps;
  const timerMinutes = metrics.timerMinutes;
  const repsPerSet = metrics.repsPerSet;
  const endedByTimer = metrics.endedByTimer;
  const endedManually = metrics.endedManually;

  if (!isNonNegativeNumber(setsCompleted) || !isNonNegativeNumber(totalReps)) {
    return { ok: false, error: 'metrics.setsCompleted/totalReps must be non-negative numbers' };
  }

  if (timerMinutes !== undefined && timerMinutes !== null && (!isNumber(timerMinutes) || timerMinutes <= 0)) {
    return { ok: false, error: 'metrics.timerMinutes must be > 0 when present' };
  }

  if (repsPerSet !== undefined && repsPerSet !== null && (!isNumber(repsPerSet) || repsPerSet <= 0)) {
    return { ok: false, error: 'metrics.repsPerSet must be > 0 when present' };
  }

  if (endedByTimer !== undefined && endedByTimer !== 0 && endedByTimer !== 1) {
    return { ok: false, error: 'metrics.endedByTimer must be 0 or 1 when present' };
  }

  if (endedManually !== undefined && endedManually !== 0 && endedManually !== 1) {
    return { ok: false, error: 'metrics.endedManually must be 0 or 1 when present' };
  }

  if (status === 'completed' && !value.endedAt) {
    return { ok: false, error: 'completed session requires endedAt' };
  }

  if (status === 'in_progress' && value.endedAt) {
    return { ok: false, error: 'in_progress session must not have endedAt' };
  }

  const events = value.setEvents;
  for (let i = 0; i < events.length; i += 1) {
    const current = events[i];
    const expectedIndex = i + 1;
    if (current.setIndex !== expectedIndex) {
      return { ok: false, error: 'setEvents.setIndex must be strictly incremental from 1' };
    }
    if (i > 0) {
      const prev = events[i - 1];
      if (new Date(current.completedAt).getTime() < new Date(prev.completedAt).getTime()) {
        return { ok: false, error: 'setEvents.completedAt must be monotonic' };
      }
    }
  }

  if (events.length > 0 && setsCompleted !== events.length) {
    return { ok: false, error: 'metrics.setsCompleted must equal setEvents.length when events exist' };
  }

  return { ok: true, value: value as unknown as WorkoutSession };
}

function isProgressSnapshot(value: unknown): value is ProgressSnapshot {
  if (!isObject(value)) return false;
  if (!isString(value.id) || !isString(value.programId) || !isString(value.date) || !isSyncMetadata(value._sync)) {
    return false;
  }

  const hasLegacyShape =
    isNumber(value.primaryValue) &&
    isNumber(value.weightKg) &&
    (value.secondaryValue === undefined || isNumber(value.secondaryValue));

  const hasMetricShape =
    isString(value.metricKey) &&
    isNumber(value.value) &&
    (value.auxValue === undefined || isNumber(value.auxValue));

  return hasLegacyShape || hasMetricShape;
}

export function validateLocalDatabase(raw: unknown): ValidationResult<LocalDatabase> {
  if (!isObject(raw)) {
    return { ok: false, error: 'DB root is not an object' };
  }

  if (!isNumber(raw.schemaVersion)) {
    return { ok: false, error: 'schemaVersion is missing or invalid' };
  }

  if (!Array.isArray(raw.programs) || !raw.programs.every(isProgramTemplate)) {
    return { ok: false, error: 'programs is missing or invalid' };
  }

  const programIdSet = new Set(raw.programs.map((program) => program.id));

  if (!Array.isArray(raw.sessions)) {
    return { ok: false, error: 'sessions is missing or invalid' };
  }

  for (const session of raw.sessions) {
    const sessionValidation = validateSession(session, programIdSet);
    if (!sessionValidation.ok) {
      return { ok: false, error: sessionValidation.error };
    }
  }

  if (!Array.isArray(raw.progress) || !raw.progress.every(isProgressSnapshot)) {
    return { ok: false, error: 'progress is missing or invalid' };
  }

  if (!isObject(raw.preferences) || !['kg', 'lb'].includes(String(raw.preferences.weightUnit))) {
    return { ok: false, error: 'preferences is missing or invalid' };
  }

  if (!isString(raw.preferences.updatedAt)) {
    return { ok: false, error: 'preferences.updatedAt is missing or invalid' };
  }

  if (!isNullableString(raw.lastBackupAt)) {
    return { ok: false, error: 'lastBackupAt is invalid' };
  }

  return { ok: true, value: raw as unknown as LocalDatabase };
}
