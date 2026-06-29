'use client';

import { ResponsiveBar } from '@nivo/bar';
import type { ApiAdminHourlyCount } from '@/lib/apiTypes';
import { ChartCard } from './ChartCard';
import { chartColors, nivoTheme } from './theme';

/** `GET /admin/stats` · `hourly[]` 와 동일 — `apiTypes.ts` 정본 */
export type HourlyCountDatum = ApiAdminHourlyCount;

type HourlyCountBarProps = {
  data: HourlyCountDatum[];
  title?: string;
};

function formatAxisHour(hour: number) {
  return `${hour}시`;
}

export function HourlyCountBar({
  data,
  title = '시간대별 작성',
}: HourlyCountBarProps) {
  const hasActivity = data.some((row) => row.count > 0);

  return (
    <ChartCard title={title} empty={!data.length || !hasActivity}>
      <ResponsiveBar
        data={data}
        keys={['count']}
        indexBy="hour"
        theme={nivoTheme}
        margin={{ top: 8, right: 8, bottom: 32, left: 36 }}
        padding={0.2}
        colors={[chartColors.accent]}
        borderRadius={4}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          format: (value) => formatAxisHour(Number(value)),
          tickValues: [0, 6, 12, 18, 23],
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
