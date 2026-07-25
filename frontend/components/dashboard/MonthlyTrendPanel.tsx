"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type TrendPoint = {
  label: string;
  income: number;
  expense: number;
};

function formatAxisValue(value: number) {
  return `${Math.round(value / 10_000)}만`;
}

export default function MonthlyTrendPanel({ data }: { data: TrendPoint[] }) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">월별 수입/지출 추이</h2>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-income" />
            수입
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-expense" />
            지출
          </span>
        </div>
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--income)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--income)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxisValue}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
            />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString("ko-KR")}원`}
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--income)"
              fill="url(#incomeFill)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--expense)"
              fill="url(#expenseFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <Link
        href="/dashboard/stats"
        className="mt-6 flex items-center justify-center rounded-xl border border-border py-2.5 text-sm font-medium text-brand hover:bg-brand-soft"
      >
        더 자세한 통계 보기 →
      </Link>
    </div>
  );
}
