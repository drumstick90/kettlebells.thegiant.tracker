/**
 * Palette light e dark per supporto automatico dark mode.
 */

export const lightColors = {
  ink900: '#222222',
  ink800: '#333333',
  ink700: '#444444',
  muted: '#6f6f6f',
  quiet: '#9d9d9d',
  chartMuted: '#b0b0b0',
  borderSoft: '#eeeeee',
  borderStrong: '#dddddd',
  surfaceBase: '#ffffff',
  surfaceSoft: '#fafafa',
  surfaceInverse: '#333333',
  whiteOverlay: 'rgba(255,255,255,0.12)',
} as const;

export const darkColors = {
  ink900: '#f5f5f5',
  ink800: '#e8e8e8',
  ink700: '#d0d0d0',
  muted: '#a0a0a0',
  quiet: '#888888',
  chartMuted: '#707070',
  borderSoft: '#2a2a2a',
  borderStrong: '#3a3a3a',
  surfaceBase: '#1c1c1e',
  surfaceSoft: '#121212',
  surfaceInverse: '#e8e8e8',
  whiteOverlay: 'rgba(0,0,0,0.2)',
} as const;

export type ColorPalette = {
  ink900: string;
  ink800: string;
  ink700: string;
  muted: string;
  quiet: string;
  chartMuted: string;
  borderSoft: string;
  borderStrong: string;
  surfaceBase: string;
  surfaceSoft: string;
  surfaceInverse: string;
  whiteOverlay: string;
};
