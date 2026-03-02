import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../../ui/primitives/AppCard';
import { colors, spacing } from '../../../ui/theme/tokens';

interface GiantWorkflowGridProps {
  sessionCount: number;
}

const CARDS = [
  { title: 'Configure cycle', text: 'Version, RM, timer, and day sequence.' },
  { title: 'Run session', text: 'Track sets with autoregulated rest.' },
  { title: 'Review trends', text: 'Compare set count and total reps.' },
  { title: 'Prepare sync', text: 'Keep local data migration-ready.' },
] as const;

export function GiantWorkflowGrid({ sessionCount }: GiantWorkflowGridProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>WORKFLOW</Text>
      <View style={styles.grid}>
        {CARDS.map((card) => (
          <View key={card.title} style={styles.item}>
            <AppCard>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardText}>{card.text}</Text>
            </AppCard>
          </View>
        ))}
      </View>
      <Text style={styles.meta}>{sessionCount} local sessions indexed</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.quiet,
    fontWeight: '600',
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
    justifyContent: 'center',
  },
  item: {
    width: '48%',
  },
  cardTitle: {
    color: colors.ink800,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  cardText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: colors.quiet,
    fontSize: 12,
    alignSelf: 'center',
  },
});
