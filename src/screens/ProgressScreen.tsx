import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useStorage } from '../context/StorageContext';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

export function ProgressScreen({ navigation }: Props) {
  const { db } = useStorage();
  const sessions = db?.sessions ?? [];
  const totalSets = sessions.reduce((acc, session) => acc + (session.metrics.setsCompleted ?? 0), 0);
  const totalReps = sessions.reduce((acc, session) => acc + (session.metrics.totalReps ?? 0), 0);
  const bestSets = sessions.reduce((best, session) => Math.max(best, session.metrics.setsCompleted ?? 0), 0);

  return (
    <ScreenScaffold>
      <AppCard>
        <Text style={styles.eyebrow}>PROGRESS</Text>
        <Text style={styles.title}>Snapshot</Text>
        <Text style={styles.subtitle}>Skeleton screen ready for charts and deeper analysis.</Text>
      </AppCard>

      <AppCard inverse>
        <View style={styles.statRow}>
          <Stat label="Sessions" value={String(sessions.length)} />
          <Stat label="Total sets" value={String(totalSets)} />
        </View>
        <View style={styles.statRow}>
          <Stat label="Total reps" value={String(totalReps)} />
          <Stat label="Best sets" value={String(bestSets)} />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.placeholder}>
          Next step: add trend charts (sets/session, density, ladder completion) using persisted data.
        </Text>
      </AppCard>

      <View style={styles.actions}>
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
    fontSize: 28,
    color: colors.ink900,
    fontWeight: '300',
  },
  subtitle: {
    marginTop: spacing.xs,
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
  placeholder: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
