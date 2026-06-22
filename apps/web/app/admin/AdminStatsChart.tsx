"use client";

import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#666666", "#D97706"];

export default function AdminStatsChart({
  visible,
  hidden,
}: {
  visible: number;
  hidden: number;
}) {
  const data = [
    { name: "공개", value: visible, fill: COLORS[0] },
    { name: "숨김", value: hidden, fill: COLORS[1] },
  ];

  const total = visible + hidden;

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm text-neutral-500">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium text-neutral-900">공개 / 숨김 비율</p>
      <div className="mt-3 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
            />
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
