import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Credits'>;

export function CreditsScreen({ navigation }: Props) {
  return (
    <ScreenScaffold>
      <AppCard>
        <Text style={styles.eyebrow}>CREDITS</Text>
        <Text style={styles.title}>The Giant protocol</Text>
        <Text style={styles.subtitle}>
          Program by Geoff Neupert. App skeleton built for focused, local-first mobile logging.
        </Text>
      </AppCard>

      <AppCard>
        <CreditRow label="Protocol" value="The Giant 1.0 / 1.1 / 1.2 / 2.0 / 3.0" />
        <CreditRow label="Platform" value="Expo + React Native + TypeScript" />
        <CreditRow label="Design language" value="Editorial operational monochrome UI" />
      </AppCard>

      <View style={styles.actions}>
        <AppButton variant="ghost" onPress={() => navigation.navigate('Home')}>
          Back home
        </AppButton>
      </View>
    </ScreenScaffold>
  );
}

function CreditRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rowLabel: {
    color: colors.ink800,
    fontSize: 14,
    fontWeight: '500',
  },
  rowValue: {
    color: colors.quiet,
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
