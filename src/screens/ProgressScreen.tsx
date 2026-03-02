import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BarChart,
  BubbleChart,
  CurveType,
  LineChart,
  PieChart,
} from 'react-native-gifted-charts';
import { useStorage } from '../context/StorageContext';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { barChartInteractive, bubbleChartInteractive, lineChartInteractive } from '../ui/chartInteractiveProps';
import { colors, spacing } from '../ui/theme/tokens';
import {
  formatDateUniform,
  linearRegression,
  movingAverage,
  niceAxisScale,
  toChartPoints,
} from '../utils/chartHelpers';
import {
  aggregatesWithDelta,
  bubbleData,
  densityOverTime,
  repsInsight,
  repsOverTime,
  setsOverTime,
  topSessionsByReps,
  volumeOverTime,
} from '../utils/sessionMetrics';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

type TabKey = 'output' | 'carico' | 'distribuzione';

const CHART_LIMIT = 14;
/** Spacing fisso per asse X uniforme su tutti i chart */
const CHART_SPACING = 44;

function formatDelta(delta: number | null | undefined): string {
  if (delta == null) return '';
  const sign = delta >= 0 ? '+' : '';
  return ` ${sign}${delta}%`;
}

export function ProgressScreen({ navigation }: Props) {
  const { db } = useStorage();
  const sessions = db?.sessions ?? [];
  const [activeTab, setActiveTab] = useState<TabKey>('output');

  const agg = useMemo(() => aggregatesWithDelta(sessions, 14), [sessions]);
  const insight = useMemo(() => repsInsight(sessions, 4, 14), [sessions]);

  const repsDomain = useMemo(() => repsOverTime(sessions, { limit: CHART_LIMIT }), [sessions]);
  const repsData = useMemo(
    () => toChartPoints(repsDomain, formatDateUniform, repsDomain.length > 8 ? 2 : 0),
    [repsDomain]
  );
  const maData = useMemo(() => movingAverage(repsData, 4), [repsData]);

  const setsDomain = useMemo(() => setsOverTime(sessions, { limit: CHART_LIMIT }), [sessions]);
  const setsData = useMemo(
    () => toChartPoints(setsDomain, formatDateUniform, setsDomain.length > 8 ? 2 : 0),
    [setsDomain]
  );

  const volumeDomain = useMemo(() => volumeOverTime(sessions, { limit: CHART_LIMIT }), [sessions]);
  const volumeAxis = useMemo(() => {
    const max = Math.max(...volumeDomain.map((d) => d.value), 1);
    return niceAxisScale(max, 4, 1.2);
  }, [volumeDomain]);
  const volumeData = useMemo(
    () => toChartPoints(volumeDomain, formatDateUniform, volumeDomain.length > 8 ? 2 : 0),
    [volumeDomain]
  );

  const densityDomain = useMemo(() => densityOverTime(sessions, { limit: CHART_LIMIT }), [sessions]);
  const densityData = useMemo(
    () => toChartPoints(densityDomain, formatDateUniform, densityDomain.length > 8 ? 2 : 0),
    [densityDomain]
  );

  const bubbleDomain = useMemo(() => bubbleData(sessions, { limit: CHART_LIMIT }), [sessions]);
  const bubbleDataFormatted = useMemo(
    () =>
      bubbleDomain.map((p) => ({
        x: p.reps,
        y: p.volume,
        r: 8 + p.weightKg * 0.5,
      })),
    [bubbleDomain]
  );

  const pieDomain = useMemo(() => topSessionsByReps(sessions, 5), [sessions]);
  const pieData = useMemo(() => toChartPoints(pieDomain, formatDateUniform), [pieDomain]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'output', label: 'Output' },
    { key: 'carico', label: 'Carico' },
    { key: 'distribuzione', label: 'Distribuzione' },
  ];

  return (
    <ScreenScaffold>
      <AppCard>
        <Text style={styles.eyebrow}>PROGRESS</Text>
        <Text style={styles.title}>Snapshot</Text>
        <Text style={styles.subtitle}>Output, carico, densità e distribuzione.</Text>
      </AppCard>

      <AppCard inverse>
        <View style={styles.kpiGrid}>
          <StatWithDelta label="Sessions" value={agg.sessionsCompleted} delta={agg.deltaSessions} />
          <StatWithDelta label="Total reps" value={agg.totalReps} delta={agg.deltaTotalReps} />
          <StatWithDelta label="Total sets" value={agg.totalSets} delta={agg.deltaTotalSets} />
          <StatWithDelta label="Volume load" value={agg.volumeLoad} delta={agg.deltaVolumeLoad} />
          <StatWithDelta label="Best reps" value={agg.bestReps} delta={agg.deltaBestReps} />
          <StatWithDelta label="Best sets" value={agg.bestSets} delta={agg.deltaBestSets} />
        </View>
      </AppCard>

      <View style={styles.tabBar}>
        {tabs.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === key && styles.tabLabelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.tabContent}>
        {activeTab === 'output' && (
          <>
            <AppCard>
              <Text style={styles.chartTitle}>Reps per session + MA 4gg</Text>
              <Text style={styles.chartDescription}>
                Quante reps hai fatto in ogni sessione. La linea tratteggiata mostra la tendenza delle ultime 4.
              </Text>
              {insight && (
                <Text style={styles.insight}>{insight}</Text>
              )}
              {repsData.length >= 2 ? (
                <View style={styles.chartWrapper}>
                  <LineChart
                    {...lineChartInteractive}
                    data={repsData}
                    data2={maData.length === repsData.length ? maData : undefined}
                    curveType={CurveType.CUBIC}
                    curvature={0.3}
                    width={280}
                    height={130}
                    color={colors.ink800}
                    color2={colors.muted}
                    thickness={2}
                    thickness2={1.5}
                    strokeDashArray2={[4, 2]}
                    hideDataPoints={repsData.length > 8}
                    hideDataPoints2
                    spacing={CHART_SPACING}
                    yAxisColor={colors.quiet}
                    xAxisColor={colors.quiet}
                    xAxisLabelTextStyle={styles.axisLabel}
                    yAxisTextStyle={styles.axisLabel}
                    yAxisLabelSuffix=" reps"
                    yAxisLabelWidth={42}
                    noOfSections={4}
                    maxValue={Math.max(50, Math.max(...repsData.map((d) => d.value)) * 1.2)}
                  />
                </View>
              ) : (
                <Text style={styles.placeholder}>Need at least 2 sessions.</Text>
              )}
            </AppCard>

            <AppCard>
              <Text style={styles.chartTitle}>Sets per session</Text>
              <Text style={styles.chartDescription}>
                Quante serie hai completato in ogni sessione.
              </Text>
              {setsData.length >= 2 ? (
                <View style={styles.chartWrapper}>
                  <BarChart
                    {...barChartInteractive}
                    data={setsData}
                    width={280}
                    barWidth={24}
                    spacing={CHART_SPACING}
                    barBorderRadius={4}
                    frontColor={colors.ink700}
                    yAxisColor={colors.quiet}
                    xAxisColor={colors.quiet}
                    xAxisLabelTextStyle={styles.axisLabel}
                    yAxisTextStyle={styles.axisLabel}
                    yAxisLabelSuffix=" sets"
                    yAxisLabelWidth={42}
                    noOfSections={4}
                    maxValue={Math.max(5, Math.max(...setsData.map((d) => d.value)) * 1.2)}
                  />
                </View>
              ) : (
                <Text style={styles.placeholder}>Need at least 2 sessions.</Text>
              )}
            </AppCard>
          </>
        )}

        {activeTab === 'carico' && (
          <>
            <AppCard>
              <Text style={styles.chartTitle}>Volume load + trend</Text>
              <Text style={styles.chartDescription}>
                Quanto carico hai sollevato in totale: reps × peso. La linea verde indica la direzione del trend.
              </Text>
              {volumeData.length >= 2 ? (
                <View style={styles.chartWrapper}>
                  <LineChart
                    {...lineChartInteractive}
                    data={volumeData}
                    data2={linearRegression(volumeData)}
                    curveType={CurveType.QUADRATIC}
                    curvature={0.2}
                    width={280}
                    height={120}
                    color={colors.ink800}
                    color2="#4a9"
                    thickness={2}
                    thickness2={1}
                    strokeDashArray2={[3, 3]}
                    hideDataPoints={volumeData.length > 8}
                    hideDataPoints2
                    areaChart
                    startFillColor={colors.ink800}
                    endFillColor={colors.borderSoft}
                    startOpacity={0.3}
                    endOpacity={0.05}
                    spacing={CHART_SPACING}
                    yAxisColor={colors.quiet}
                    xAxisColor={colors.quiet}
                    xAxisLabelTextStyle={styles.axisLabel}
                    yAxisTextStyle={styles.axisLabel}
                    yAxisLabelSuffix=" kg"
                    yAxisLabelWidth={48}
                    noOfSections={4}
                    maxValue={volumeAxis.maxValue}
                    stepValue={volumeAxis.stepValue}
                    roundToDigits={0}
                    showFractionalValues={false}
                  />
                </View>
              ) : (
                <Text style={styles.placeholder}>Need at least 2 sessions.</Text>
              )}
            </AppCard>

            <AppCard>
              <Text style={styles.chartTitle}>Densità reps/min</Text>
              <Text style={styles.chartDescription}>
                Quanto sei stato efficiente: quante reps al minuto in ogni sessione.
              </Text>
              {densityData.length >= 2 ? (
                <View style={styles.chartWrapper}>
                  <BarChart
                    {...barChartInteractive}
                    data={densityData}
                    width={280}
                    barWidth={24}
                    spacing={CHART_SPACING}
                    barBorderRadius={4}
                    frontColor={colors.ink700}
                    yAxisColor={colors.quiet}
                    xAxisColor={colors.quiet}
                    xAxisLabelTextStyle={styles.axisLabel}
                    yAxisTextStyle={styles.axisLabel}
                    yAxisLabelSuffix=" reps/min"
                    yAxisLabelWidth={50}
                    noOfSections={4}
                    maxValue={Math.max(5, Math.max(...densityData.map((d) => d.value)) * 1.15)}
                  />
                </View>
              ) : (
                <Text style={styles.placeholder}>
                  Need completed sessions with duration. Log workouts with end time.
                </Text>
              )}
            </AppCard>
          </>
        )}

        {activeTab === 'distribuzione' && (
          <>
            <AppCard>
              <Text style={styles.chartTitle}>Reps vs volume (size = peso)</Text>
              <Text style={styles.chartDescription}>
                Ogni bolla è una sessione: più grande il peso usato, più grande la bolla. Vedi come reps e carico si distribuiscono.
              </Text>
              {bubbleDataFormatted.length >= 2 ? (
                <View style={styles.chartWrapper}>
                  <BubbleChart
                    {...bubbleChartInteractive}
                    data={bubbleDataFormatted}
                    width={280}
                    height={160}
                    maxY={Math.max(100, Math.max(...bubbleDataFormatted.map((d) => d.y)) * 1.1)}
                    showGradient={false}
                  />
                </View>
              ) : (
                <Text style={styles.placeholder}>Need at least 2 sessions.</Text>
              )}
            </AppCard>

            <AppCard>
              <Text style={styles.chartTitle}>Top 5 sessioni (reps)</Text>
              <Text style={styles.chartDescription}>
                Le tue 5 sessioni migliori per reps totali.
              </Text>
              {pieData.length >= 1 ? (
                <View style={styles.chartWrapper}>
                  <PieChart
                    data={pieData}
                    donut={false}
                    radius={80}
                    showText
                    textColor={colors.ink800}
                    textSize={12}
                  />
                </View>
              ) : (
                <Text style={styles.placeholder}>Need at least 1 session.</Text>
              )}
            </AppCard>
          </>
        )}
      </View>

      <View style={styles.actions}>
        <AppButton variant="ghost" onPress={() => navigation.navigate('Home')}>
          Back home
        </AppButton>
      </View>
    </ScreenScaffold>
  );
}

function StatWithDelta({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  delta?: number | null;
}) {
  const deltaStr = formatDelta(delta);
  const deltaColor = delta != null && delta >= 0 ? '#4a9' : delta != null ? '#c96' : undefined;
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {deltaStr ? (
          <Text style={[styles.statDelta, deltaColor ? { color: deltaColor } : undefined]}>
            {deltaStr}
          </Text>
        ) : null}
      </View>
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    minWidth: '30%',
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
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statDelta: {
    color: '#9d9d9d',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 4,
    backgroundColor: colors.borderSoft,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.ink800,
  },
  tabLabel: {
    fontSize: 13,
    color: colors.ink800,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink800,
    marginBottom: spacing.xxs,
  },
  chartDescription: {
    fontSize: 12,
    color: colors.chartMuted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  axisLabel: {
    fontSize: 10,
    color: colors.quiet,
  },
  insight: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  chartWrapper: {
    alignItems: 'center',
    marginVertical: spacing.xs,
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
