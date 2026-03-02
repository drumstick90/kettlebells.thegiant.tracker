import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
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
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const [showFlash, setShowFlash] = useState(false);

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

  const triggerFlash = useCallback(() => {
    setShowFlash(true);
    flashOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setShowFlash(false);
    });
  }, [flashOpacity]);

  const handleLogSet = () => {
    if (isCompleteDisabled) {
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    triggerFlash();
    setEvents((current) => appendSetEvent(current, plan, elapsedDeciseconds));
  };

  const handleUndo = () => {
    setEvents((current) => undoLastSetEvent(current));
  };

  const { width, height } = Dimensions.get('window');

  return (
    <ScreenScaffold>
      <Modal visible={showFlash} transparent animationType="none" statusBarTranslucent>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashOverlay,
            {
              width,
              height,
              opacity: flashOpacity,
            },
          ]}
        />
      </Modal>
      <View style={styles.heroWrap}>
      <AppCard>
        <Text style={styles.eyebrow}>LIVE WORKOUT</Text>
        <Text style={styles.liveTitle}>
          The Giant {config.version} · Week {config.week} Day {config.day}
        </Text>
        <Text style={styles.liveSub}>
          {plan.label} · {rmType} · {config.weightKg}kg · {config.timerMinutes} min
        </Text>
      </AppCard>
      </View>

      <AppCard>
        <View style={styles.timerWrap}>
          <CountdownRing progress={progress} />
          <View style={styles.timerCenter}>
            <Text style={styles.countdown}>{countdownLabel}</Text>
            <Text style={styles.elapsed}>elapsed {elapsedLabel}</Text>
          </View>
        </View>
      </AppCard>

      <View style={styles.targetWrap}>
      <AppCard>
        <Text style={styles.kicker}>NEXT TARGET</Text>
        <Text style={styles.targetText}>
          {nextTarget.repsTarget} reps
          {nextTarget.ladderCycle ? ` · ladder ${nextTarget.ladderCycle}.${nextTarget.ladderStep}` : ''}
        </Text>
        <Text style={styles.meta}>Sets completed: {events.length}</Text>
        <Text style={styles.meta}>Last set timestamp: {lastEventLabel}</Text>
      </AppCard>
      </View>

      <Pressable
        onPress={handleLogSet}
        disabled={isCompleteDisabled}
        style={[styles.logButton, isCompleteDisabled && styles.logButtonDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Serie completata"
        accessibilityHint={isCompleteDisabled ? 'Timer in pausa o scaduto' : 'Registra il completamento della serie'}
      >
        <Text style={styles.logButtonText}>Serie completata</Text>
      </Pressable>

      <View style={styles.actionRow}>
        <AppButton
          variant="ghost"
          onPress={handleUndo}
          accessibilityLabel="Undo ultimo set"
          accessibilityHint="Annulla l'ultima serie registrata"
        >
          Undo ultimo
        </AppButton>
        <AppButton
          variant="ghost"
          onPress={handlePauseToggle}
          accessibilityLabel={isPaused ? 'Riprendi timer' : 'Metti in pausa'}
          accessibilityHint={isPaused ? 'Riprende il countdown' : 'Mette in pausa il timer'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </AppButton>
        <AppButton
          onPress={() => void finalizeSession('manual', eventsRef.current)}
          accessibilityLabel="Termina sessione"
          accessibilityHint="Chiude la sessione e salva i dati"
        >
          Termina
        </AppButton>
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
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(220,255,220,0.9)',
    zIndex: 9999,
  },
  heroWrap: {
    alignItems: 'center',
  },
  targetWrap: {
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 10,
    color: colors.quiet,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  liveTitle: {
    fontSize: 24,
    color: colors.ink900,
    fontWeight: '300',
    textAlign: 'center',
  },
  liveSub: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  targetText: {
    fontSize: 25,
    color: colors.ink900,
    fontWeight: '300',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xxs,
    textAlign: 'center',
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
    justifyContent: 'center',
  },
});
