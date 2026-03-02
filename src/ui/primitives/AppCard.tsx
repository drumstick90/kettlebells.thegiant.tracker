import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../theme/tokens';

interface AppCardProps {
  children: ReactNode;
  inverse?: boolean;
}

export function AppCard({ children, inverse = false }: AppCardProps) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          borderColor: colors.borderSoft,
          backgroundColor: colors.surfaceBase,
        },
        inverse && {
          borderColor: 'rgba(255,255,255,0.18)',
          backgroundColor: colors.surfaceInverse,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
});
