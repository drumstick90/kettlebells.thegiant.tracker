import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useStorage } from '../context/StorageContext';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export function HistoryScreen({ navigation }: Props) {
  const { db } = useStorage();
  const sessions = db?.sessions ?? [];
  const orderedSessions = [...sessions].reverse();

  return (
    <ScreenScaffold>
      <AppCard>
        <Text style={styles.eyebrow}>HISTORY</Text>
        <Text style={styles.title}>Session archive</Text>
        <Text style={styles.subtitle}>All local sessions with weight, sets, reps and end mode.</Text>
      </AppCard>

      <AppCard>
        {orderedSessions.length === 0 ? (
          <Text style={styles.empty}>No sessions yet. Complete a live workout first.</Text>
        ) : (
          orderedSessions.map((session) => {
            const metrics = session.metrics;
            return (
              <View key={session.id} style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.rowTitle}>
                    {new Date(session.startedAt).toLocaleDateString()} · {session.weightKg}kg
                  </Text>
                  <Text style={styles.rowMeta}>
                    V{metrics.version ?? '-'} · W{metrics.week ?? '-'} D{metrics.day ?? '-'} · sets{' '}
                    {metrics.setsCompleted ?? 0} · reps {metrics.totalReps ?? 0}
                  </Text>
                </View>
                <Text style={styles.rowMode}>{metrics.endedManually ? 'manual' : 'timer'}</Text>
              </View>
            );
          })
        )}
      </AppCard>

      <View style={styles.actions}>
        <AppButton onPress={() => navigation.navigate('Setup')}>New workout</AppButton>
        <AppButton variant="ghost" onPress={() => navigation.navigate('Home')}>
          Back home
        </AppButton>
      </View>
    </ScreenScaffold>
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
  empty: {
    color: colors.quiet,
    fontSize: 14,
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  col: {
    flex: 1,
  },
  rowTitle: {
    color: colors.ink800,
    fontSize: 14,
    fontWeight: '600',
  },
  rowMeta: {
    marginTop: spacing.xxs,
    color: colors.muted,
    fontSize: 12,
  },
  rowMode: {
    color: colors.quiet,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
