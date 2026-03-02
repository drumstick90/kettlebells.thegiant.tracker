import { useEffect, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { GiantCycleSummaryCard } from '../features/giant/components/GiantCycleSummaryCard';
import { GiantIdentityRow } from '../features/giant/components/GiantIdentityRow';
import { GiantWorkflowGrid } from '../features/giant/components/GiantWorkflowGrid';
import { useStorage } from '../context/StorageContext';
import type { RootStackParamList } from '../navigation/types';
import { getLatestGiantCycle } from '../utils/sessionMetrics';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const DEFAULT_CYCLE = { version: '1.0' as const, week: 1 as const, day: 1 as const };

export function HomeScreen({ navigation }: Props) {
  const { db } = useStorage();
  const sessionCount = db?.sessions.length ?? 0;
  const latestSession = db && db.sessions.length > 0 ? db.sessions[db.sessions.length - 1] : undefined;

  if (__DEV__) {
    console.log('[Home] sessionCount', sessionCount);
  }

  useEffect(() => {
    if (__DEV__) {
      console.log('[Home] Quick links render', { sessionCount });
    }
  }, [sessionCount]);

  const cycleProps = useMemo(() => {
    const sessions = db?.sessions ?? [];
    const latest = getLatestGiantCycle(sessions);
    const result = latest ?? DEFAULT_CYCLE;
    if (__DEV__) {
      console.log('[Home] GiantCycleSummaryCard', {
        hasLatestSession: !!latest,
        version: result.version,
        week: result.week,
        day: result.day,
      });
    }
    return result;
  }, [db?.sessions]);

  return (
    <ScreenScaffold>
      <View style={styles.centered}>
        <GiantIdentityRow />
      </View>
      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
        <AppCard>
          <Text style={styles.eyebrow}>THE GIANT TRACKER</Text>
          <Text style={styles.title}>
            Traccia le tue <Text style={styles.titleStrong}>sessioni live</Text> e registra le serie in tempo reale.
          </Text>
          <Text style={styles.subtitle}>
            Setup, allenamento, revisione. Dati local-first con timestamp precisi per ogni serie.
          </Text>
          <View style={styles.ctaRow}>
            <AppButton
              onPress={() => navigation.navigate('Setup')}
              style={styles.ctaPrimary}
            >
              Avvia setup sessione
            </AppButton>
            <AppButton variant="ghost" onPress={() => navigation.navigate('History')}>
              Cronologia
            </AppButton>
          </View>
        </AppCard>
        </View>
      </View>

      <GiantCycleSummaryCard
        version={cycleProps.version}
        week={cycleProps.week}
        day={cycleProps.day}
      />
      <GiantWorkflowGrid
        sessionCount={sessionCount}
        onNavigate={(screen) => navigation.navigate(screen)}
      />

      <AppCard>
        <Text style={styles.sectionTitle}>Link rapidi</Text>
        <View style={styles.quickLinksPrimary}>
          <AppButton onPress={() => navigation.navigate('Progress')}>Progressi</AppButton>
        </View>
        <View style={styles.linksRow}>
          <AppButton variant="ghost" onPress={() => navigation.navigate('Settings')}>
            Impostazioni
          </AppButton>
          <AppButton variant="ghost" onPress={() => navigation.navigate('Credits')}>
            Crediti
          </AppButton>
        </View>
        <Text style={styles.meta}>
          {sessionCount} sessioni locali
          {latestSession ? ` · Ultimo carico ${latestSession.weightKg} kg` : ''}
        </Text>
      </AppCard>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
  },
  heroWrap: {
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.quiet,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink800,
    fontWeight: '300',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleStrong: {
    fontWeight: '600',
    color: colors.ink900,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  ctaRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  ctaPrimary: {
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.ink900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  quickLinksPrimary: {
    marginBottom: spacing.xs,
  },
  linksRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
    justifyContent: 'center',
  },
  meta: {
    color: colors.quiet,
    fontSize: 12,
    textAlign: 'center',
  },
});
