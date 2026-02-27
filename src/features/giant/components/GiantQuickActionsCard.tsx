import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../ui/primitives/AppButton';
import { AppCard } from '../../../ui/primitives/AppCard';
import { colors, spacing } from '../../../ui/theme/tokens';

interface GiantQuickActionsCardProps {
  sessionCount: number;
  onLogSession: () => void;
}

export function GiantQuickActionsCard({ sessionCount, onLogSession }: GiantQuickActionsCardProps) {
  return (
    <AppCard>
      <Text style={styles.title}>Progressi</Text>
      <Text style={styles.body}>{sessionCount} sessioni salvate in locale</Text>
      <View style={styles.actions}>
        <AppButton onPress={onLogSession}>Log sessione demo</AppButton>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.ink900,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});
