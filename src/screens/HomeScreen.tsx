import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { GiantCycleSummaryCard } from '../features/giant/components/GiantCycleSummaryCard';
import { GiantIdentityRow } from '../features/giant/components/GiantIdentityRow';
import { GiantWorkflowGrid } from '../features/giant/components/GiantWorkflowGrid';
import { useStorage } from '../context/StorageContext';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { db } = useStorage();
  const sessionCount = db?.sessions.length ?? 0;
  const latestSession = db && db.sessions.length > 0 ? db.sessions[db.sessions.length - 1] : undefined;

  return (
    <ScreenScaffold>
      <View style={styles.centered}>
        <GiantIdentityRow />
      </View>
      <View style={styles.heroWrap}>
      <AppCard>
        <Text style={styles.eyebrow}>THE GIANT TRACKER</Text>
        <Text style={styles.title}>
          Build your <Text style={styles.titleStrong}>live session flow</Text> and log sets in real time.
        </Text>
        <Text style={styles.subtitle}>
          Mobile workflow: setup, train, review. Local-first data with precise set timestamps.
        </Text>
        <View style={styles.ctaRow}>
          <AppButton onPress={() => navigation.navigate('Setup')}>Start session setup</AppButton>
          <AppButton variant="ghost" onPress={() => navigation.navigate('History')}>
            View history
          </AppButton>
        </View>
      </AppCard>
      </View>

      <GiantCycleSummaryCard version="1.0" week={1} day={1} />
      <GiantWorkflowGrid sessionCount={sessionCount} />

      <AppCard>
        <Text style={styles.sectionTitle}>Quick links</Text>
        <View style={styles.linksRow}>
          <AppButton variant="pill" onPress={() => navigation.navigate('Progress')}>
            Progress
          </AppButton>
          <AppButton variant="pill" onPress={() => navigation.navigate('Settings')}>
            Settings
          </AppButton>
          <AppButton variant="pill" onPress={() => navigation.navigate('Credits')}>
            Credits
          </AppButton>
        </View>
        <Text style={styles.meta}>
          {sessionCount} local sessions indexed
          {latestSession ? ` · Last load ${latestSession.weightKg}kg` : ''}
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
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.ink900,
    marginBottom: spacing.sm,
    textAlign: 'center',
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
