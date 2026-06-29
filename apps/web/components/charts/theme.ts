import type { PartialTheme } from '@nivo/theming';

export const chartColors = {
  primary: '#335b73',
  primarySoft: '#e4eff5',
  muted: '#94a3b8',
  visible: '#335b73',
  hidden: '#cbd5e1',
  accent: '#abc8da',
} as const;

export const nivoTheme: PartialTheme = {
  text: { fontSize: 12, fill: '#335b73' },
  axis: {
    ticks: { text: { fill: '#64748b' } },
    legend: { text: { fill: '#335b73' } },
  },
  grid: { line: { stroke: '#e2e8f0' } },
  tooltip: {
    container: {
      background: '#ffffff',
      color: '#335b73',
      borderRadius: '12px',
      border: '1px solid rgba(53,53,53,0.1)',
      boxShadow: '2px 2px 0 #dce7ed',
    },
  },
};

/** 슬라이스·막대 시리즈용 — 순환 팔레트 */
export const chartPalette = [
  chartColors.primary,
  chartColors.accent,
  chartColors.primarySoft,
  '#64748b',
] as const;
