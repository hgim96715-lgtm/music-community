'use client';

import { ResponsiveBar } from '@nivo/bar';
import type { ApiAdminMonthlyCount } from '@/lib/apiTypes';
import { ChartCard } from './ChartCard';
import { chartColors, nivoTheme } from './theme';

/** `GET /admin/stats` · `monthly[]` 와 동일 — `apiTypes.ts` 정본 */
export type MonthlyCountDatum = ApiAdminMonthlyCount;

type MonthlyCountBarProps = {
  data: MonthlyCountDatum[];
  title?: string;
};

/** `YYYY-MM` → `6월` (같은 해 가정) · 연도가 섞이면 `26/6` */
function formatAxisMonth(monthKey: string, showYear: boolean) {
  const [year, month] = monthKey.split('-');
  if (showYear) {
    return `${year.slice(2)}/${Number(month)}`;
  }
  return `${Number(month)}월`;
}

export function MonthlyCountBar({
  data,
  title = '올해 월별',
}: MonthlyCountBarProps) {
  const hasActivity = data.some((row) => row.count > 0);
  const years = new Set(data.map((row) => row.month.slice(0, 4)));
  const showYear = years.size > 1;

  return (
    <ChartCard title={title} empty={!data.length || !hasActivity}>
      <ResponsiveBar
        data={data}
        keys={['count']}
        indexBy="month"
        theme={nivoTheme}
        margin={{ top: 8, right: 8, bottom: 32, left: 36 }}
        padding={0.35}
        colors={[chartColors.primary]}
        borderRadius={4}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          format: (value) => formatAxisMonth(String(value), showYear),
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 4,
        }}
        enableLabel={false}
        role="application"
        ariaLabel={title}
      />
    </ChartCard>
  );
}
