import type { PartialTheme } from '@nivo/theming';

export const chartColors = {
  primary: '#c9a66b',
  primarySoft: '#3a322a',
  muted: '#a89880',
  visible: '#c9a66b',
  hidden: '#5c4a38',
  accent: '#8a7048',
} as const;

export const nivoTheme: PartialTheme = {
  text: { fontSize: 12, fill: '#c9a66b' },
  axis: {
    ticks: { text: { fill: '#a89880' } },
    legend: { text: { fill: '#c9a66b' } },
  },
  grid: { line: { stroke: '#3a322a' } },
  tooltip: {
    container: {
      background: '#f3ebe3',
      color: '#1a1410',
      borderRadius: '12px',
      border: '1px solid rgba(31,26,22,0.15)',
      boxShadow: '2px 2px 0 #2e261f',
    },
  },
};

/** 슬라이스·막대 시리즈용 — 순환 팔레트 */
export const chartPalette = [
  chartColors.primary,
  chartColors.accent,
  chartColors.muted,
  '#6b5428',
] as const;
