import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../../../ui/primitives/AppButton';
import { colors, spacing, typography } from '../../../ui/theme/tokens';

interface GiantHeroInputCardProps {
  weightKgText: string;
  onWeightKgTextChange: (value: string) => void;
  onPrimaryAction: () => void;
}

export function GiantHeroInputCard({
  weightKgText,
  onWeightKgTextChange,
  onPrimaryAction,
}: GiantHeroInputCardProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>CLEAN + PRESS PROTOCOL</Text>
      <Text style={styles.title}>
        Track <Text style={styles.titleStrong}>The Giant</Text> sessions with calm precision.
      </Text>
      <Text style={styles.subtitle}>
        Local-first, modular by design, and ready for Apple or Google Calendar sync.
      </Text>

      <View style={styles.inputBlock}>
        <Text style={styles.inputLabel}>DEFAULT LOAD (KG)</Text>
        <TextInput
          value={weightKgText}
          onChangeText={onWeightKgTextChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="numeric"
          placeholder="24"
          placeholderTextColor="#c8c8c8"
          style={[styles.underlineInput, focused && styles.underlineInputFocused]}
        />
      </View>

      <View style={styles.ctaRow}>
        <AppButton onPress={onPrimaryAction}>Log session</AppButton>
        <AppButton variant="ghost" onPress={() => {}}>
          View history
        </AppButton>
      </View>
      <View style={styles.pillRow}>
        <AppButton variant="pill" onPress={() => {}}>
          20 min
        </AppButton>
        <AppButton variant="pill" onPress={() => {}}>
          30 min
        </AppButton>
        <AppButton variant="pill" onPress={() => {}}>
          Week +1 set
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.quiet,
    fontWeight: '600',
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.ink800,
    fontWeight: '300',
  },
  titleStrong: {
    fontWeight: '600',
    color: colors.ink900,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.muted,
  },
  inputBlock: {
    marginTop: spacing.sm,
    gap: spacing.xxs,
  },
  inputLabel: {
    fontSize: 10,
    color: colors.quiet,
    letterSpacing: 1.3,
    fontWeight: '600',
  },
  underlineInput: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink800,
    paddingVertical: spacing.xs,
    fontSize: 22,
    color: colors.ink800,
    fontWeight: '500',
    fontFamily: typography.mono,
  },
  underlineInputFocused: {
    borderBottomColor: '#000000',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
});
