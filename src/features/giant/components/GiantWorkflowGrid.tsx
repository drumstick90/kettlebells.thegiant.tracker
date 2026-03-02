import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../../ui/primitives/AppCard';
import { colors, spacing } from '../../../ui/theme/tokens';

interface GiantWorkflowGridProps {
  sessionCount: number;
  onNavigate: (screen: 'Setup' | 'Progress' | 'Settings') => void;
}

const CARDS: {
  title: string;
  text: string;
  screen: 'Setup' | 'Progress' | 'Settings';
}[] = [
  { title: 'Configura ciclo', text: 'Versione, RM, timer e sequenza giorni.', screen: 'Setup' },
  { title: 'Esegui sessione', text: 'Traccia le serie con riposo autoregolato.', screen: 'Setup' },
  { title: 'Rivedi trend', text: 'Confronta numero serie e ripetizioni totali.', screen: 'Progress' },
  { title: 'Prepara sync', text: 'Mantieni i dati locali pronti per la migrazione.', screen: 'Settings' },
];

export function GiantWorkflowGrid({ sessionCount, onNavigate }: GiantWorkflowGridProps) {
  const reviewHint =
    sessionCount === 0
      ? 'Completa la tua prima sessione per sbloccare i trend'
      : `Hai ${sessionCount} sessioni — vai a Progress per vedere i trend`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>WORKFLOW</Text>
      <View style={styles.grid}>
        {CARDS.map((card) => (
          <Pressable
            key={card.title}
            style={styles.item}
            onPress={() => {
              if (__DEV__) console.log('[GiantWorkflowGrid] card press', { cardTitle: card.title, sessionCount });
              onNavigate(card.screen);
            }}
          >
            <AppCard>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardText}>{card.text}</Text>
              {card.screen === 'Progress' && (
                <Text style={styles.cardHint}>{reviewHint}</Text>
              )}
            </AppCard>
          </Pressable>
        ))}
      </View>
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
  cardHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.quiet,
    fontStyle: 'italic',
  },
  meta: {
    color: colors.quiet,
    fontSize: 12,
    alignSelf: 'center',
  },
});
