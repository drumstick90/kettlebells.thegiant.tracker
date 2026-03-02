import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { GiantDay, GiantVersion } from '../domain/giant/types';
import { getGiantDayPlan } from '../domain/giant/rules';
import type { RootStackParamList } from '../navigation/types';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { useTheme } from '../context/ThemeContext';
import type { ColorPalette } from '../ui/theme/colors';
import { spacing } from '../ui/theme/tokens';

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
  const colors = useTheme();
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
    if (nextWeight !== weightKg) setWeightKg(nextWeight);
  };

  const handleWheelTouchStart = (touchY: number) => {
    const centerStart = WEIGHT_ITEM_HEIGHT * ((WEIGHT_VISIBLE_ROWS - 1) / 2);
    const centerEnd = centerStart + WEIGHT_ITEM_HEIGHT;
    setIsWheelScrollEnabled(touchY >= centerStart && touchY <= centerEnd);
  };

  return (
    <ScreenScaffold>
      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
          <AppCard>
            <Text style={[styles.eyebrow, { color: colors.quiet }]}>SETUP SESSIONE</Text>
            <Text style={[styles.title, { color: colors.ink800 }]}>Configura la sessione live di The Giant.</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Scegli versione, settimana, giorno e carico, poi passa direttamente all'allenamento.</Text>
          </AppCard>
        </View>
      </View>

      <AppCard>
        <Text style={[styles.label, { color: colors.quiet }]}>VERSIONE</Text>
        <OptionRow options={VERSIONS} value={version} onChange={setVersion} colors={colors} />

        <Text style={[styles.label, { color: colors.quiet }]}>SETTIMANA</Text>
        <OptionRow options={WEEKS} value={week} onChange={setWeek} colors={colors} />

        <Text style={[styles.label, { color: colors.quiet }]}>GIORNO</Text>
        <OptionRow options={DAYS} value={day} onChange={setDay} colors={colors} />

        <Text style={[styles.label, { color: colors.quiet }]}>TIMER</Text>
        <OptionRow options={TIMERS} value={timerMinutes} onChange={setTimerMinutes} formatter={(v) => `${v} min`} colors={colors} />

        <Text style={[styles.label, { color: colors.quiet }]}>CARICO (KG)</Text>
        <View style={[styles.wheelWrap, { borderColor: colors.surfaceBase, backgroundColor: colors.surfaceBase }]}>
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
            onTouchStart={(e) => handleWheelTouchStart(e.nativeEvent.locationY)}
            onTouchCancel={() => setIsWheelScrollEnabled(false)}
            onTouchEnd={() => setIsWheelScrollEnabled(false)}
            onMomentumScrollEnd={(e) => handleWeightSnap(e.nativeEvent.contentOffset.y)}
            onScrollEndDrag={(e) => handleWeightSnap(e.nativeEvent.contentOffset.y)}
            renderItem={({ item }) => {
              const distanceFromSelected = Math.abs(item - weightKg);
              const selected = distanceFromSelected === 0;
              const adjacent = distanceFromSelected === 1;
              return (
                <Pressable
                  onPress={() => {
                    setWeightKg(item);
                    weightListRef.current?.scrollToIndex({ index: item - MIN_WEIGHT_KG, animated: true });
                  }}
                  style={styles.wheelItem}
                >
                  <Text
                    style={[
                      styles.wheelItemText,
                      { color: colors.quiet },
                      selected && [styles.wheelItemTextSelected, { color: colors.ink900 }],
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
          <View style={[styles.wheelSelectionBand, { borderTopColor: colors.borderSoft, borderBottomColor: colors.borderSoft, backgroundColor: colors.surfaceBase }]} pointerEvents="none" />
        </View>
      </AppCard>

      <View style={styles.previewWrap}>
        <AppCard inverse>
          <Text style={styles.previewKicker}>PIANO OGGI</Text>
          <Text style={styles.previewTitle}>The Giant {version}</Text>
          <Text style={styles.previewText}>
            Sett. {week} · Giorno {day} · {plan.label} · {timerMinutes} min
          </Text>
        </AppCard>
      </View>

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
          accessibilityLabel="Avvia sessione live"
          accessibilityHint="Apre la schermata di allenamento con timer"
        >
          Avvia sessione live
        </AppButton>
        <AppButton
          variant="ghost"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Indietro"
          accessibilityHint="Torna alla schermata precedente"
        >
          Indietro
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
  colors: ColorPalette;
}

function OptionRow<T extends string | number>({ options, value, onChange, formatter, colors }: OptionRowProps<T>) {
  return (
    <View style={styles.optionRow}>
      {options.map((option) => {
        const selected = option === value;
        const label = formatter ? formatter(option) : String(option);
        return (
          <Pressable
            key={String(option)}
            onPress={() => onChange(option)}
            style={[
              styles.optionChip,
              { borderColor: colors.borderSoft, backgroundColor: colors.surfaceSoft },
              selected && { borderColor: colors.ink800, backgroundColor: colors.ink800 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
          >
            <Text
              style={[
                styles.optionChipText,
                { color: colors.ink800 },
                selected && { color: colors.surfaceBase },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  previewWrap: {
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '300',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  label: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  optionChip: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  wheelWrap: {
    height: WEIGHT_ITEM_HEIGHT * WEIGHT_VISIBLE_ROWS,
    borderWidth: 1,
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
    fontWeight: '300',
    opacity: 0.4,
  },
  wheelItemTextSelected: {
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
    opacity: 0.25,
  },
  previewKicker: {
    color: '#d4d4d4',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  previewTitle: {
    color: '#ffffff',
    fontWeight: '300',
    fontSize: 26,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  previewText: {
    color: '#e6e6e6',
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
});
