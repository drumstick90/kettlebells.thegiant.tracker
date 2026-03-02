import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../theme/tokens';

interface AppButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'pill';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AppButton({ children, onPress, variant = 'primary', style, accessibilityLabel, accessibilityHint }: AppButtonProps) {
  const colors = useTheme();
  const isGhost = variant === 'ghost';
  const isPill = variant === 'pill';

  const variantStyle =
    variant === 'primary'
      ? { backgroundColor: colors.ink800, borderColor: colors.ink800 }
      : { backgroundColor: variant === 'ghost' ? 'transparent' : colors.surfaceSoft, borderColor: colors.borderSoft };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.base, variantStyle, pressed && styles.pressed, style]}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' ? { color: '#ffffff' } : { color: colors.ink800 },
          isPill && styles.pillText,
        ]}
      >
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
  pressed: {
    opacity: 0.75,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pillText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
