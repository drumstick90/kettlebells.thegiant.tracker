import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useKeepAwake } from 'expo-keep-awake';
import { useStorage } from '../context/StorageContext';
import { getGiantDayPlan, getRmType } from '../domain/giant/rules';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';
import { appendSetEvent, finishGiantLiveSession, formatElapsedLabelFromDeciseconds, getSetTarget, undoLastSetEvent } from '../features/giant/live/usecases';
import type { GiantSetEvent } from '../features/giant/live/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveWorkout'>;

export function LiveWorkoutScreen({ navigation, route }: Props) {
  useKeepAwake();
  const { db, persist } = useStorage();
  const { config } = route.params;
  const plan = useMemo(() => getGiantDayPlan(config.version, config.day), [config.day, config.version]);
  const rmType = useMemo(() => getRmType(config.version), [config.version]);

  const [events, setEvents] = useState<GiantSetEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAtMs, setPausedAtMs] = useState<number | null>(null);
  const [pausedTotalMs, setPausedTotalMs] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());

  const eventsRef = useRef<GiantSetEvent[]>([]);
  const startedAtMsRef = useRef(Date.now());
  const startedAtIsoRef = useRef(new Date(startedAtMsRef.current).toISOString());
  const finishingRef = useRef(false);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const totalDeciseconds = config.timerMinutes * 60 * 10;
  const effectiveNowMs = isPaused && pausedAtMs ? pausedAtMs : nowMs;
  const elapsedMs = Math.max(0, effectiveNowMs - startedAtMsRef.current - pausedTotalMs);
  const elapsedDeciseconds = Math.floor(elapsedMs / 100);
  const remainingDeciseconds = Math.max(0, totalDeciseconds - elapsedDeciseconds);
  const progress = totalDeciseconds > 0 ? remainingDeciseconds / totalDeciseconds : 0;
  const countdownLabel = formatCountdown(remainingDeciseconds);
  const elapsedLabel = formatElapsedLabelFromDeciseconds(elapsedDeciseconds);
  const lastEventLabel = events.length > 0 ? events[events.length - 1].elapsedLabel : '--:--.-';
  const nextTarget = getSetTarget(plan, events.length + 1);
  const isCompleteDisabled = isPaused || remainingDeciseconds <= 0;

  const finalizeSession = useCallback(
    async (endedBy: 'timer' | 'manual', snapshot: GiantSetEvent[]) => {
      if (finishingRef.current || !db) {
        return;
      }

      finishingRef.current = true;
      const endedAt = new Date().toISOString();
      const result = finishGiantLiveSession(db, {
        startedAt: startedAtIsoRef.current,
        endedAt,
        endedBy,
        events: snapshot,
        plan,
        versionNumber: Number(config.version),
        week: config.week,
        day: config.day,
        timerMinutes: config.timerMinutes,
        weightKg: config.weightKg,
      });
      await persist(result.db);

      navigation.replace('SessionSummary', {
        config,
        events: snapshot,
        startedAt: startedAtIsoRef.current,
        endedAt,
        endedBy,
        totalReps: result.totalReps,
        sessionId: result.session.id,
      });
    },
    [config, db, navigation, persist, plan]
  );

  useEffect(() => {
    if (!isPaused && remainingDeciseconds <= 0) {
      void finalizeSession('timer', eventsRef.current);
    }
  }, [finalizeSession, isPaused, remainingDeciseconds]);

  const handlePauseToggle = () => {
    if (isPaused) {
      const resumeAt = Date.now();
      const pausedStartedAt = pausedAtMs ?? resumeAt;
      setPausedTotalMs((current) => current + (resumeAt - pausedStartedAt));
      setPausedAtMs(null);
      setNowMs(resumeAt);
      setIsPaused(false);
      return;
    }

    const now = Date.now();
    setPausedAtMs(now);
    setIsPaused(true);
  };

  const handleLogSet = () => {
    if (isCompleteDisabled) {
      return;
    }

    setEvents((current) => appendSetEvent(current, plan, elapsedDeciseconds));
  };

  const handleUndo = () => {
    setEvents((current) => undoLastSetEvent(current));
  };

  return (
    <ScreenScaffold>
      <AppCard>
        <Text style={styles.eyebrow}>LIVE WORKOUT</Text>
        <Text style={styles.liveTitle}>
          The Giant {config.version} · Week {config.week} Day {config.day}
        </Text>
        <Text style={styles.liveSub}>
          {plan.label} · {rmType} · {config.weightKg}kg · {config.timerMinutes} min
        </Text>
      </AppCard>

      <AppCard>
        <View style={styles.timerWrap}>
          <CountdownRing progress={progress} />
          <View style={styles.timerCenter}>
            <Text style={styles.countdown}>{countdownLabel}</Text>
            <Text style={styles.elapsed}>elapsed {elapsedLabel}</Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.kicker}>NEXT TARGET</Text>
        <Text style={styles.targetText}>
          {nextTarget.repsTarget} reps
          {nextTarget.ladderCycle ? ` · ladder ${nextTarget.ladderCycle}.${nextTarget.ladderStep}` : ''}
        </Text>
        <Text style={styles.meta}>Sets completed: {events.length}</Text>
        <Text style={styles.meta}>Last set timestamp: {lastEventLabel}</Text>
      </AppCard>

      <Pressable
        onPress={handleLogSet}
        disabled={isCompleteDisabled}
        style={[styles.logButton, isCompleteDisabled && styles.logButtonDisabled]}
      >
        <Text style={styles.logButtonText}>Serie completata</Text>
      </Pressable>

      <View style={styles.actionRow}>
        <AppButton variant="ghost" onPress={handleUndo}>
          Undo ultimo
        </AppButton>
        <AppButton variant="ghost" onPress={handlePauseToggle}>
          {isPaused ? 'Resume' : 'Pause'}
        </AppButton>
        <AppButton onPress={() => void finalizeSession('manual', eventsRef.current)}>Termina</AppButton>
      </View>
    </ScreenScaffold>
  );
}

function CountdownRing({ progress }: { progress: number }) {
  const size = 220;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clampedProgress);

  return (
    <Svg width={size} height={size} style={styles.ringSvg}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.borderSoft}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.ink800}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function formatCountdown(totalDeciseconds: number): string {
  const safe = Math.max(0, totalDeciseconds);
  const totalSeconds = Math.floor(safe / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 10,
    color: colors.quiet,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  liveTitle: {
    fontSize: 24,
    color: colors.ink900,
    fontWeight: '300',
  },
  liveSub: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 14,
  },
  timerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  ringSvg: {
    transform: [{ rotate: '-90deg' }, { scaleX: -1 }],
  },
  timerCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  countdown: {
    fontSize: 44,
    color: colors.ink900,
    fontWeight: '300',
    letterSpacing: -1,
  },
  elapsed: {
    marginTop: spacing.xxs,
    fontSize: 13,
    color: colors.quiet,
  },
  kicker: {
    fontSize: 10,
    color: colors.quiet,
    letterSpacing: 1.3,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  targetText: {
    fontSize: 25,
    color: colors.ink900,
    fontWeight: '300',
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xxs,
  },
  logButton: {
    borderWidth: 1,
    borderColor: colors.ink800,
    backgroundColor: colors.ink800,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: spacing.md,
  },
  logButtonDisabled: {
    opacity: 0.45,
  },
  logButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
});
