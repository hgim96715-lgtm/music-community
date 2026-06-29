'use client';

import { ResponsiveBar } from '@nivo/bar';
import type { ApiAdminDailyCount } from '@/lib/apiTypes';
import { ChartCard } from './ChartCard';
import { chartColors, nivoTheme } from './theme';

/** `GET /admin/stats` · `daily[]` 와 동일 — `apiTypes.ts` 정본 */
export type DailyCountDatum = ApiAdminDailyCount;

type DailyCountBarProps = {
  data: DailyCountDatum[];
  title?: string;
};

/** API `date` = `YYYY-MM-DD` (서버 로컬) — UTC 파싱 시 하루 밀림 방지 */
function formatAxisDate(dateKey: string) {
  const [, month, day] = dateKey.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function DailyCountBar({
  data,
  title = '최근 7일',
}: DailyCountBarProps) {
  const hasActivity = data.some((row) => row.count > 0);

  return (
    <ChartCard title={title} empty={!data.length || !hasActivity}>
      <ResponsiveBar
        data={data}
        keys={['count']}
        indexBy="date"
        theme={nivoTheme}
        margin={{ top: 8, right: 8, bottom: 32, left: 36 }}
        padding={0.35}
        colors={[chartColors.primary]}
        borderRadius={4}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          format: formatAxisDate,
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
