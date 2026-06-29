'use client';

import { ResponsiveLine } from '@nivo/line';
import type { ApiAdminDailyCount } from '@/lib/apiTypes';
import { ChartCard } from './ChartCard';
import { chartColors, nivoTheme } from './theme';

type ActivityLineChartProps = {
  data: ApiAdminDailyCount[];
  title?: string;
};

function formatAxisDate(dateKey: string) {
  const [, month, day] = dateKey.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function ActivityLineChart({
  data,
  title = '최근 7일 추이',
}: ActivityLineChartProps) {
  const hasActivity = data.some((row) => row.count > 0);

  const series = [
    {
      id: '작성 수',
      data: data.map((row) => ({
        x: formatAxisDate(row.date),
        y: row.count,
      })),
    },
  ];

  return (
    <ChartCard title={title} empty={!data.length || !hasActivity}>
      <ResponsiveLine
        data={series}
        theme={nivoTheme}
        margin={{ top: 8, right: 16, bottom: 32, left: 36 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 0 }}
        curve="monotoneX"
        colors={[chartColors.primary]}
        lineWidth={2}
        pointSize={8}
        pointBorderWidth={2}
        pointBorderColor={chartColors.primary}
        pointColor="#ffffff"
        enableArea
        areaOpacity={0.12}
        enableGridX={false}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 4,
        }}
        useMesh
        enablePoints
        role="application"
        ariaLabel={title}
      />
    </ChartCard>
  );
}
