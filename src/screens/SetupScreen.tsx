import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { GiantDay, GiantVersion } from '../domain/giant/types';
import { getGiantDayPlan } from '../domain/giant/rules';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

const VERSIONS: GiantVersion[] = ['1.0', '1.1', '1.2', '2.0', '3.0'];
const WEEKS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
const DAYS: GiantDay[] = [1, 2, 3];
const TIMERS: Array<20 | 30> = [20, 30];
const MIN_WEIGHT_KG = 4;
const MAX_WEIGHT_KG = 80;
const WEIGHT_ITEM_HEIGHT = 36;
const WEIGHT_VISIBLE_ROWS = 5;

export function SetupScreen({ navigation, route }: Props) {
  const prefill = route.params?.prefill;
  const [version, setVersion] = useState<GiantVersion>(prefill?.version ?? '1.0');
  const [week, setWeek] = useState<1 | 2 | 3 | 4>(prefill?.week ?? 1);
  const [day, setDay] = useState<GiantDay>(prefill?.day ?? 1);
  const [timerMinutes, setTimerMinutes] = useState<20 | 30>(prefill?.timerMinutes ?? 20);
  const [weightKg, setWeightKg] = useState(prefill?.weightKg ?? 24);
  const [isWheelScrollEnabled, setIsWheelScrollEnabled] = useState(false);
  const weightOptions = useMemo(
    () => Array.from({ length: MAX_WEIGHT_KG - MIN_WEIGHT_KG + 1 }, (_, idx) => MIN_WEIGHT_KG + idx),
    []
  );
  const weightListRef = useRef<FlatList<number>>(null);

  const plan = useMemo(() => getGiantDayPlan(version, day), [day, version]);

  useEffect(() => {
    const initialIndex = Math.max(0, Math.min(weightOptions.length - 1, weightKg - MIN_WEIGHT_KG));
    const timeout = setTimeout(() => {
      weightListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    }, 0);

    return () => clearTimeout(timeout);
  }, [weightOptions.length]);

  const handleWeightSnap = (offsetY: number) => {
    const rawIndex = Math.round(offsetY / WEIGHT_ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(weightOptions.length - 1, rawIndex));
    const nextWeight = weightOptions[clampedIndex];
    if (nextWeight !== weightKg) {
      setWeightKg(nextWeight);
    }
  };

  const handleWheelTouchStart = (touchY: number) => {
    const centerStart = WEIGHT_ITEM_HEIGHT * ((WEIGHT_VISIBLE_ROWS - 1) / 2);
    const centerEnd = centerStart + WEIGHT_ITEM_HEIGHT;
    const startsInCenterRow = touchY >= centerStart && touchY <= centerEnd;
    setIsWheelScrollEnabled(startsInCenterRow);
  };

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
        <View style={styles.wheelWrap}>
          <FlatList
            ref={weightListRef}
            data={weightOptions}
            keyExtractor={(item) => String(item)}
            showsVerticalScrollIndicator={false}
            scrollEnabled={isWheelScrollEnabled}
            nestedScrollEnabled
            directionalLockEnabled
            alwaysBounceVertical={false}
            snapToInterval={WEIGHT_ITEM_HEIGHT}
            decelerationRate="fast"
            style={styles.wheelList}
            contentContainerStyle={styles.wheelContent}
            getItemLayout={(_, index) => ({
              length: WEIGHT_ITEM_HEIGHT,
              offset: WEIGHT_ITEM_HEIGHT * index,
              index,
            })}
            onTouchStart={(event) => handleWheelTouchStart(event.nativeEvent.locationY)}
            onTouchCancel={() => setIsWheelScrollEnabled(false)}
            onTouchEnd={() => setIsWheelScrollEnabled(false)}
            onMomentumScrollEnd={(event) => handleWeightSnap(event.nativeEvent.contentOffset.y)}
            onScrollEndDrag={(event) => handleWeightSnap(event.nativeEvent.contentOffset.y)}
            renderItem={({ item }) => {
              const distanceFromSelected = Math.abs(item - weightKg);
              const selected = distanceFromSelected === 0;
              const adjacent = distanceFromSelected === 1;
              return (
                <Pressable
                  onPress={() => {
                    setWeightKg(item);
                    weightListRef.current?.scrollToIndex({
                      index: item - MIN_WEIGHT_KG,
                      animated: true,
                    });
                  }}
                  style={styles.wheelItem}
                >
                  <Text
                    style={[
                      styles.wheelItemText,
                      selected && styles.wheelItemTextSelected,
                      adjacent && styles.wheelItemTextAdjacent,
                      distanceFromSelected > 1 && styles.wheelItemTextHidden,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
          <View style={styles.wheelSelectionBand} pointerEvents="none" />
        </View>
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
  wheelWrap: {
    height: WEIGHT_ITEM_HEIGHT * WEIGHT_VISIBLE_ROWS,
    borderWidth: 1,
    borderColor: colors.surfaceBase,
    backgroundColor: colors.surfaceBase,
    overflow: 'hidden',
  },
  wheelList: {
    flex: 1,
  },
  wheelContent: {
    paddingVertical: WEIGHT_ITEM_HEIGHT * ((WEIGHT_VISIBLE_ROWS - 1) / 2),
  },
  wheelItem: {
    height: WEIGHT_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontSize: 19,
    color: colors.quiet,
    fontWeight: '300',
    opacity: 0.4,
  },
  wheelItemTextSelected: {
    color: colors.ink900,
    fontWeight: '600',
    fontSize: 28,
    opacity: 1,
  },
  wheelItemTextAdjacent: {
    fontSize: 16,
    fontWeight: '300',
    opacity: 0.45,
  },
  wheelItemTextHidden: {
    opacity: 0,
  },
  wheelSelectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WEIGHT_ITEM_HEIGHT * ((WEIGHT_VISIBLE_ROWS - 1) / 2),
    height: WEIGHT_ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: colors.borderSoft,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.surfaceBase,
    opacity: 0.25,
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
