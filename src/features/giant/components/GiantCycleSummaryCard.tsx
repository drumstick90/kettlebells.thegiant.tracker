import { StyleSheet, Text, View } from 'react-native';
import type { GiantDay, GiantVersion } from '../../../domain/giant/types';
import { getGiantDayPlan, getRmType } from '../../../domain/giant/rules';
import { AppCard } from '../../../ui/primitives/AppCard';
import { colors, spacing } from '../../../ui/theme/tokens';

interface GiantCycleSummaryCardProps {
  version: GiantVersion;
  day: GiantDay;
  week: 1 | 2 | 3 | 4;
}

export function GiantCycleSummaryCard({ version, day, week }: GiantCycleSummaryCardProps) {
  const plan = getGiantDayPlan(version, day);
  const rmType = getRmType(version);

  return (
    <AppCard inverse>
      <View style={styles.ringA} />
      <View style={styles.ringB} />
      <View style={styles.row}>
        <Text style={styles.kicker}>CYCLE</Text>
        <Text style={styles.kicker}>WEEK {week}</Text>
      </View>
      <Text style={styles.title}>The Giant {version}</Text>
      <Text style={styles.subtitle}>Day {day} · {plan.label} · {rmType}</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>LOAD</Text>
          <Text style={styles.statValue}>{rmType}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>FOCUS</Text>
          <Text style={styles.statValue}>C&P</Text>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
    zIndex: 2,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1.3,
    fontWeight: '600',
    color: '#d4d4d4',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#ffffff',
    marginBottom: spacing.xs,
    zIndex: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#e6e6e6',
    zIndex: 2,
    textAlign: 'center',
  },
  statsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 2,
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
  ringA: {
    position: 'absolute',
    top: -34,
    right: -18,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ringB: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
