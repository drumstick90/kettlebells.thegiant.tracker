import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { GiantDay, GiantVersion } from '../domain/giant/types';
import { getGiantDayPlan } from '../domain/giant/rules';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing, typography } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

const VERSIONS: GiantVersion[] = ['1.0', '1.1', '1.2', '2.0', '3.0'];
const WEEKS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
const DAYS: GiantDay[] = [1, 2, 3];
const TIMERS: Array<20 | 30> = [20, 30];

export function SetupScreen({ navigation, route }: Props) {
  const prefill = route.params?.prefill;
  const [version, setVersion] = useState<GiantVersion>(prefill?.version ?? '1.0');
  const [week, setWeek] = useState<1 | 2 | 3 | 4>(prefill?.week ?? 1);
  const [day, setDay] = useState<GiantDay>(prefill?.day ?? 1);
  const [timerMinutes, setTimerMinutes] = useState<20 | 30>(prefill?.timerMinutes ?? 20);
  const [weightText, setWeightText] = useState(String(prefill?.weightKg ?? 24));

  const plan = useMemo(() => getGiantDayPlan(version, day), [day, version]);
  const parsedWeight = Number(weightText);
  const weightKg = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 24;

  return (
    <ScreenScaffold>
      <AppCard>
        <Text style={styles.eyebrow}>SESSION SETUP</Text>
        <Text style={styles.title}>Configure The Giant live workout.</Text>
        <Text style={styles.subtitle}>Pick cycle details and move straight into the training screen.</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.label}>VERSION</Text>
        <OptionRow options={VERSIONS} value={version} onChange={setVersion} />

        <Text style={styles.label}>WEEK</Text>
        <OptionRow options={WEEKS} value={week} onChange={setWeek} />

        <Text style={styles.label}>DAY</Text>
        <OptionRow options={DAYS} value={day} onChange={setDay} />

        <Text style={styles.label}>TIMER</Text>
        <OptionRow options={TIMERS} value={timerMinutes} onChange={setTimerMinutes} formatter={(v) => `${v} min`} />

        <Text style={styles.label}>LOAD (KG)</Text>
        <TextInput
          value={weightText}
          onChangeText={setWeightText}
          keyboardType="numeric"
          style={styles.input}
          placeholder="24"
          placeholderTextColor="#c8c8c8"
        />
      </AppCard>

      <AppCard inverse>
        <Text style={styles.previewKicker}>TODAY PLAN</Text>
        <Text style={styles.previewTitle}>The Giant {version}</Text>
        <Text style={styles.previewText}>
          Week {week} · Day {day} · {plan.label} · {timerMinutes} min
        </Text>
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          onPress={() =>
            navigation.navigate('LiveWorkout', {
              config: {
                version,
                week,
                day,
                timerMinutes,
                weightKg,
              },
            })
          }
        >
          Start live workout
        </AppButton>
        <AppButton variant="ghost" onPress={() => navigation.goBack()}>
          Back
        </AppButton>
      </View>
    </ScreenScaffold>
  );
}

interface OptionRowProps<T extends string | number> {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  formatter?: (value: T) => string;
}

function OptionRow<T extends string | number>({ options, value, onChange, formatter }: OptionRowProps<T>) {
  return (
    <View style={styles.optionRow}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={String(option)}
            onPress={() => onChange(option)}
            style={[styles.optionChip, selected && styles.optionChipSelected]}
          >
            <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
              {formatter ? formatter(option) : String(option)}
            </Text>
          </Pressable>
        );
      })}
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
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink800,
    fontWeight: '300',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  label: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontSize: 10,
    color: colors.quiet,
    letterSpacing: 1.3,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionChipSelected: {
    borderColor: colors.ink800,
    backgroundColor: colors.ink800,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink800,
  },
  optionChipTextSelected: {
    color: colors.surfaceBase,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink800,
    paddingVertical: spacing.xs,
    fontSize: 22,
    color: colors.ink800,
    fontWeight: '500',
    fontFamily: typography.mono,
  },
  previewKicker: {
    color: '#d4d4d4',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  previewTitle: {
    color: '#ffffff',
    fontWeight: '300',
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  previewText: {
    color: '#e6e6e6',
    fontSize: 14,
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
