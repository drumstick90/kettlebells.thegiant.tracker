import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionSummary'>;

export function SessionSummaryScreen({ navigation, route }: Props) {
  const { config, events, endedBy, totalReps, sessionId, startedAt, endedAt } = route.params;
  const minutesTrained = Math.max(0, (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  const density = minutesTrained > 0 ? events.length / minutesTrained : 0;

  return (
    <ScreenScaffold>
      <AppCard>
        <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
        <Text style={styles.title}>The Giant {config.version}</Text>
        <Text style={styles.subtitle}>
          Week {config.week} · Day {config.day} · {endedBy === 'timer' ? 'Timer finished' : 'Manual stop'}
        </Text>
      </AppCard>

      <AppCard inverse>
        <View style={styles.statRow}>
          <Stat label="Sets" value={String(events.length)} />
          <Stat label="Total reps" value={String(totalReps)} />
        </View>
        <View style={styles.statRow}>
          <Stat label="Density" value={`${density.toFixed(2)} set/min`} />
          <Stat label="Load" value={`${config.weightKg}kg`} />
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

      <AppCard>
        <Text style={styles.meta}>Session id: {sessionId}</Text>
      </AppCard>

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 10,
    color: colors.quiet,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 30,
    color: colors.ink900,
    fontWeight: '300',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  },
  meta: {
    fontSize: 12,
    color: colors.quiet,
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
