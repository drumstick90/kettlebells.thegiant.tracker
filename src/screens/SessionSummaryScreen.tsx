import { useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import { useStorage } from '../context/StorageContext';
import {
  densityMetrics,
  deltaPercent,
  getPreviousSessionOfSameType,
} from '../utils/sessionMetrics';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionSummary'>;

export function SessionSummaryScreen({ navigation, route }: Props) {
  const { db } = useStorage();
  const { config, events, endedBy, totalReps, sessionId, startedAt, endedAt } = route.params;

  const { densityReps, densitySets, deltaReps, deltaSets } = useMemo(() => {
    const current = densityMetrics({
      startedAt,
      endedAt,
      metrics: { totalReps, setsCompleted: events.length },
    });
    const sessions = db?.sessions ?? [];
    const prev = getPreviousSessionOfSameType(sessions, config.version, startedAt);
    if (!prev || !prev.endedAt) {
      return {
        densityReps: current.repsPerMin,
        densitySets: current.setsPerMin,
        deltaReps: null as number | null,
        deltaSets: null as number | null,
      };
    }
    const prevDensity = densityMetrics({
      startedAt: prev.startedAt,
      endedAt: prev.endedAt,
      metrics: {
        totalReps: prev.metrics?.totalReps ?? 0,
        setsCompleted: prev.metrics?.setsCompleted ?? 0,
      },
    });
    return {
      densityReps: current.repsPerMin,
      densitySets: current.setsPerMin,
      deltaReps: deltaPercent(current.repsPerMin, prevDensity.repsPerMin),
      deltaSets: deltaPercent(current.setsPerMin, prevDensity.setsPerMin),
    };
  }, [config.version, db?.sessions, endedAt, events.length, startedAt, totalReps]);

  return (
    <ScreenScaffold>
      <View style={styles.heroWrap}>
      <AppCard>
        <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
        <Text style={styles.title}>The Giant {config.version}</Text>
        <Text style={styles.subtitle}>
          Week {config.week} · Day {config.day} · {endedBy === 'timer' ? 'Timer finished' : 'Manual stop'}
        </Text>
      </AppCard>
      </View>

      <AppCard inverse>
        <View style={styles.statRow}>
          <Stat label="Sets" value={String(events.length)} />
          <Stat label="Total reps" value={String(totalReps)} />
          <Stat label="Load" value={`${config.weightKg}kg`} />
        </View>
        <View style={styles.statRow}>
          <Stat
            label="Reps/min"
            value={formatDensityValue(densityReps, deltaReps)}
          />
          <Stat
            label="Sets/min"
            value={formatDensityValue(densitySets, deltaSets)}
          />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.section}>Set timeline</Text>
        {events.length === 0 ? (
          <Text style={styles.empty}>No set events recorded.</Text>
        ) : (
          events.map((event) => (
            <View key={`${event.setIndex}-${event.elapsedDeciseconds}`} style={styles.row}>
              <Text style={styles.rowLabel}>
                #{event.setIndex} · {event.repsTarget} reps
                {event.ladderCycle ? ` · L${event.ladderCycle}.${event.ladderStep}` : ''}
              </Text>
              <Text style={styles.rowValue}>{event.elapsedLabel}</Text>
            </View>
          ))
        )}
      </AppCard>

      <View style={styles.metaWrap}>
      <AppCard>
        <Text style={styles.meta}>Session id: {sessionId}</Text>
      </AppCard>
      </View>

      <View style={styles.actions}>
        <AppButton onPress={() => navigation.navigate('History')}>Go to history</AppButton>
        <AppButton variant="ghost" onPress={() => navigation.navigate('Setup', { prefill: config })}>
          Repeat setup
        </AppButton>
        <AppButton variant="ghost" onPress={() => navigation.navigate('Home')}>
          Back home
        </AppButton>
      </View>
    </ScreenScaffold>
  );
}

function formatDensityValue(value: number, delta: number | null): string {
  const formatted = value.toFixed(2);
  if (delta === null) return formatted;
  const sign = delta >= 0 ? '+' : '';
  return `${formatted} (${sign}${delta}% vs prev)`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    alignItems: 'center',
  },
  metaWrap: {
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
  title: {
    fontSize: 30,
    color: colors.ink900,
    fontWeight: '300',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing.sm,
  },
  statLabel: {
    color: '#d9d9d9',
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: spacing.xxs,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.ink900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.ink800,
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    color: colors.quiet,
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
    color: colors.quiet,
    textAlign: 'center',
  },
  meta: {
    fontSize: 12,
    color: colors.quiet,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
});
