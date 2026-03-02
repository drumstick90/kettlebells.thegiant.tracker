/**
 * Props condivise per rendere i chart Gifted Charts interattivi:
 * - LineChart: pointer strip + tooltip al tap
 * - BarChart: highlight al tap
 * - PieChart: selezione slice
 * - BubbleChart: focus
 */
import { colors } from './theme/tokens';

export const lineChartInteractive = {
  showPointerStrip: true,
  activatePointersInstantlyOnTouch: true,
  activatePointersOnLongPress: false,
  pointerConfig: {
    pointerStripColor: colors.quiet,
    pointerStripWidth: 2,
    pointerColor: colors.ink800,
    pointerLabelWidth: 70,
    pointerLabelHeight: 36,
  },
  /** Disabilita scroll interno così il tap va al chart e non allo scroll */
  disableScroll: true,
} as const;

export const barChartInteractive = {
  highlightEnabled: true,
  disableScroll: true,
} as const;

export const bubbleChartInteractive = {
  focusEnabled: true,
  showBubbleOnFocus: true,
  showBubbleLabelOnFocus: true,
} as const;
