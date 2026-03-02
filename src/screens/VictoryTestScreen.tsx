/**
 * Pagina di prova Victory Native — isolata per non rompere Progress
 * Fallback: CartesianChart fallisce prima del children render (Skia/Expo), usiamo Gifted
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useStorage } from '../context/StorageContext';
import type { RootStackParamList } from '../navigation/types';
import type { WorkoutSession } from '../schema';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'VictoryTest'>;

function toGiftedData(sessions: WorkoutSession[], limit = 14) {
  const sorted = [...sessions]
    .filter((s) => (s.metrics.totalReps ?? 0) > 0)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .slice(-limit);
  return sorted.map((s) => {
    const d = new Date(s.startedAt);
    const label = `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
    return { value: s.metrics.totalReps ?? 0, label };
  });
}

export function VictoryTestScreen({ navigation }: Props) {
  const { db } = useStorage();
  const sessions = db?.sessions ?? [];
  const chartData = useMemo(() => toGiftedData(sessions), [sessions]);

  return (
    <ScreenScaffold>
      <AppCard>
        <Text style={styles.eyebrow}>CHART TEST</Text>
        <Text style={styles.title}>Reps per session</Text>
        <Text style={styles.subtitle}>Victory Native non compatibile con Expo attuale — usiamo Gifted Charts.</Text>
      </AppCard>

      <AppCard>
        {chartData.length >= 2 ? (
          <View style={styles.chartWrapper}>
            <LineChart
              data={chartData}
              width={280}
              height={160}
              color={colors.ink800}
              thickness={2}
              hideDataPoints={chartData.length > 8}
              spacing={chartData.length > 6 ? 40 : 60}
              yAxisColor={colors.quiet}
              xAxisColor={colors.quiet}
              noOfSections={4}
              maxValue={Math.max(50, Math.max(...chartData.map((d) => d.value)) * 1.15)}
            />
          </View>
        ) : (
          <Text style={styles.placeholder}>Serve almeno 2 sessioni per il chart.</Text>
        )}
      </AppCard>

      <View style={styles.actions}>
        <AppButton variant="ghost" onPress={() => navigation.goBack()}>
          Indietro
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
  chartWrapper: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  placeholder: {
    color: colors.muted,
    fontSize: 14,
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
