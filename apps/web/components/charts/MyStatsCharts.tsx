'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { Disc3, Music2, Quote } from 'lucide-react';
import type { ApiMyStats } from '@/lib/apiTypes';
import { nivoTheme } from './theme';

type MyStatsChartsProps = {
  stats: ApiMyStats;
};

const SERIES = [
  { key: 'savedCards', label: '카드', color: '#d2aa68' },
  { key: 'savedLyrics', label: '가사', color: '#a889bc' },
  { key: 'recommendations', label: '추천', color: '#6f9d91' },
] as const;

const MOOD_CHART_COLORS = [
  '#d6a86b',
  '#9f88bd',
  '#6fa194',
  '#c77f79',
  '#7f99bd',
  '#c2a35b',
] as const;

const panelClassName =
  'rounded-2xl border border-[rgb(201_166_107/0.18)] bg-[linear-gradient(145deg,rgb(49_41_34/0.78),rgb(28_24_20/0.92))] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_8px_22px_rgb(0_0_0/0.18)]';

function formatAxisDate(dateKey: string) {
  const [, month, day] = dateKey.split('-');
  return `${Number(month)}/${Number(day)}`;
}

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="grid h-full place-items-center text-center text-xs text-[#8f806c]">
      {children}
    </div>
  );
}

function ChartTooltip({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex max-w-52 items-center gap-1.5 rounded-lg border border-[#3a3028] bg-[#f3ebe3] px-2 py-1 text-[11px] leading-tight font-semibold whitespace-nowrap text-[#1a1410] shadow-lg">
      <i
        className="size-2 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="truncate">{children}</span>
    </div>
  );
}

export function MyStatsCharts({ stats }: MyStatsChartsProps) {
  const totals = [
    {
      label: '내 앨범',
      value: stats.savedCards.total,
      unit: '장',
      icon: Disc3,
      accent: '#d2aa68',
    },
    {
      label: '모은 가사',
      value: stats.savedLyrics.total,
      unit: '쪽',
      icon: Quote,
      accent: '#a889bc',
    },
    {
      label: '추천한 곡',
      value: stats.recommendations.total,
      unit: '곡',
      icon: Music2,
      accent: '#6f9d91',
    },
  ];

  const hasDailyActivity = stats.daily.some(
    (row) =>
      row.savedCards > 0 ||
      row.savedLyrics > 0 ||
      row.recommendations > 0,
  );

  const moodData = stats.moods.slice(0, 6).map(({ mood, count }, index) => ({
    id: mood,
    label: mood,
    value: count,
    color: MOOD_CHART_COLORS[index % MOOD_CHART_COLORS.length],
  }));

  const artistData = stats.artists.slice(0, 8).map(({ artist, count }) => ({
    artist,
    count,
  }));

  return (
    <div className="space-y-4">
      <section aria-label="누적 활동" className="grid grid-cols-3 gap-2">
        {totals.map(({ label, value, unit, icon: Icon, accent }) => (
          <article
            key={label}
            className="relative overflow-hidden rounded-xl border border-[rgb(201_166_107/0.16)] bg-[rgb(42_36_30/0.72)] px-3 py-3">
            <span
              className="absolute inset-x-0 top-0 h-0.5 opacity-80"
              style={{ backgroundColor: accent }}
            />
            <Icon
              className="mb-2 size-4"
              style={{ color: accent }}
              aria-hidden
            />
            <p className="text-[10px] font-medium text-[#a89880]">{label}</p>
            <p className="mt-0.5 text-lg font-bold tracking-tight text-[#f1e8dc]">
              {value}
              <span className="ml-0.5 text-[10px] font-medium text-[#8f806c]">
                {unit}
              </span>
            </p>
          </article>
        ))}
      </section>

      <section className={panelClassName} aria-label="최근 7일 활동">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#f1e8dc]">최근 7일의 기록</p>
            <p className="mt-0.5 text-[10px] text-[#8f806c]">
              저장하고 기록한 음악 활동
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-x-2 gap-y-1">
            {SERIES.map(({ key, label, color }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[9px] text-[#a89880]">
                <i
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="h-56 min-w-0">
          {!hasDailyActivity ? (
            <EmptyChart>이번 주 활동이 아직 없어요</EmptyChart>
          ) : (
            <ResponsiveBar
              data={stats.daily}
              keys={SERIES.map(({ key }) => key)}
              indexBy="date"
              theme={nivoTheme}
              margin={{ top: 18, right: 4, bottom: 32, left: 28 }}
              padding={0.28}
              innerPadding={2}
              groupMode="grouped"
              colors={SERIES.map(({ color }) => color)}
              borderRadius={3}
              enableLabel={false}
              axisBottom={{
                tickSize: 0,
                tickPadding: 9,
                format: formatAxisDate,
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 7,
                tickValues: 4,
              }}
              gridYValues={4}
              tooltip={({ id, value, indexValue, color }) => {
                const series = SERIES.find(({ key }) => key === id);
                return (
                  <ChartTooltip color={color}>
                    {formatAxisDate(String(indexValue))} ·{' '}
                    {series?.label ?? String(id)} {value}
                  </ChartTooltip>
                );
              }}
              role="application"
              ariaLabel="최근 7일 카드, 가사, 추천 활동"
            />
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={panelClassName} aria-label="자주 쓴 태그">
          <div>
            <p className="text-sm font-bold text-[#f1e8dc]">나의 분위기</p>
            <p className="mt-0.5 text-[10px] text-[#8f806c]">
              추천할 때 자주 고른 태그
            </p>
          </div>
          <div className="mt-2 grid min-h-52 grid-cols-[minmax(0,1fr)_6.5rem] items-center">
            {moodData.length === 0 ? (
              <div className="col-span-2 h-52">
                <EmptyChart>추천에 태그를 남기면 분위기가 보여요</EmptyChart>
              </div>
            ) : (
              <>
                <div className="h-52 min-w-0">
                  <ResponsivePie
                    data={moodData}
                    theme={nivoTheme}
                    margin={{ top: 16, right: 8, bottom: 16, left: 8 }}
                    innerRadius={0.68}
                    padAngle={2}
                    cornerRadius={4}
                    activeOuterRadiusOffset={5}
                    colors={{ datum: 'data.color' }}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.7]] }}
                    enableArcLabels={false}
                    enableArcLinkLabels={false}
                    tooltip={({ datum }) => (
                      <ChartTooltip color={datum.color}>
                        {datum.label} · {datum.value}회
                      </ChartTooltip>
                    )}
                  />
                </div>
                <ul className="space-y-2">
                  {moodData.map(({ id, value, color }) => (
                    <li
                      key={id}
                      className="flex min-w-0 items-center gap-1.5 text-[10px]">
                      <i
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[#cbbba0]">
                        {id}
                      </span>
                      <span className="shrink-0 text-[#8f806c]">{value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className={panelClassName} aria-label="많이 추천한 가수">
          <div>
            <p className="text-sm font-bold text-[#f1e8dc]">자주 찾은 목소리</p>
            <p className="mt-0.5 text-[10px] text-[#8f806c]">
              내가 많이 추천한 아티스트
            </p>
          </div>
          <div className="mt-2 h-52 min-w-0">
            {artistData.length === 0 ? (
              <EmptyChart>곡을 추천하면 아티스트 순위가 보여요</EmptyChart>
            ) : (
              <ResponsiveBar
                data={artistData}
                keys={['count']}
                indexBy="artist"
                layout="horizontal"
                theme={nivoTheme}
                margin={{ top: 8, right: 36, bottom: 20, left: 88 }}
                padding={0.42}
                colors={['#b38b56']}
                borderRadius={4}
                enableGridX={false}
                enableGridY={false}
                enableLabel={false}
                axisTop={null}
                axisRight={null}
                axisBottom={null}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 7,
                }}
                layers={[
                  'grid',
                  'axes',
                  'bars',
                  ({ bars }) => (
                    <g>
                      {bars.map((bar) => (
                        <text
                          key={bar.key}
                          x={bar.x + bar.width + 7}
                          y={bar.y + bar.height / 2}
                          dominantBaseline="central"
                          fill="#cbbba0"
                          fontSize={10}
                          fontWeight={600}>
                          {bar.data.formattedValue}
                        </text>
                      ))}
                    </g>
                  ),
                  'markers',
                  'legends',
                  'annotations',
                ]}
                tooltip={({ value, indexValue, color }) => (
                  <ChartTooltip color={color}>
                    {indexValue} · {value}곡
                  </ChartTooltip>
                )}
                role="application"
                ariaLabel="많이 추천한 아티스트"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
