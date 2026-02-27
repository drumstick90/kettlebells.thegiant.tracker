import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

interface AppButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'pill';
}

export function AppButton({ children, onPress, variant = 'primary' }: AppButtonProps) {
  const isGhost = variant === 'ghost';
  const isPill = variant === 'pill';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPill ? styles.pill : isGhost ? styles.ghost : styles.primary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, (isGhost || isPill) && styles.ghostText, isPill && styles.pillText]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.ink800,
    borderColor: colors.ink800,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.borderSoft,
  },
  pill: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderSoft,
  },
  pressed: {
    opacity: 0.75,
  },
  text: {
    color: colors.surfaceBase,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  ghostText: {
    color: colors.ink800,
  },
  pillText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
