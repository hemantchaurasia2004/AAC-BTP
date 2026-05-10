"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type SeriesDef = { key: string; color: string; name: string };

export function LiveLineChart({
  data,
  title,
  series,
}: {
  data: Record<string, number | string>[];
  title: string;
  series: (SeriesDef & { dashed?: boolean })[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
            <XAxis dataKey="t" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                dot={false}
                name={s.name}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "6 4" : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
