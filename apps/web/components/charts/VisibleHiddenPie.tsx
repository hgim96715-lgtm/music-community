'use client';

import { ResponsivePie } from '@nivo/pie';
import { ChartCard } from './ChartCard';
import { chartColors, nivoTheme } from './theme';

type PieDatum = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type VisibleHiddenPieProps = {
  visible: number;
  hidden: number;
};

const TITLE = '공개 / 숨김';

export function VisibleHiddenPie({ visible, hidden }: VisibleHiddenPieProps) {
  const total = visible + hidden;

  const data: PieDatum[] = [
    {
      id: 'visible',
      label: '공개',
      value: visible,
      color: chartColors.visible,
    },
    {
      id: 'hidden',
      label: '숨김',
      value: hidden,
      color: chartColors.hidden,
    },
  ].filter((row) => row.value > 0);

  return (
    <ChartCard
      title={TITLE}
      empty={total === 0}
      emptyMessage="표시할 추천이 없어요.">
      <ResponsivePie
        data={data}
        theme={nivoTheme}
        margin={{ top: 8, right: 8, bottom: 48, left: 8 }}
        innerRadius={0.55}
        padAngle={2}
        cornerRadius={4}
        activeOuterRadiusOffset={6}
        colors={(slice) => slice.data.color}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.15]] }}
        enableArcLinkLabels={false}
        enableArcLabels={false}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            translateY: 40,
            itemWidth: 72,
            itemHeight: 18,
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
      />
    </ChartCard>
  );
}
