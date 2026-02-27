import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

interface AppCardProps {
  children: ReactNode;
  inverse?: boolean;
}

export function AppCard({ children, inverse = false }: AppCardProps) {
  return <View style={[styles.base, inverse && styles.inverse]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceBase,
    padding: spacing.md,
  },
  inverse: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: colors.surfaceInverse,
  },
});
