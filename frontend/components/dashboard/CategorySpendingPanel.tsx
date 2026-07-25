"use client";

import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { CategoryExpense } from "@/lib/api-client";
import { getCategoryMeta } from "@/lib/category-meta";
import { formatWon } from "@/lib/format";

export default function CategorySpendingPanel({
  categoryExpenses,
  totalExpense,
}: {
  categoryExpenses: CategoryExpense[];
  totalExpense: number;
}) {
  const items = categoryExpenses
    .map((item) => ({ ...item, meta: getCategoryMeta(item.categoryName) }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-gray-900">카테고리별 지출</h2>

      {items.length === 0 ? (
        <p className="mt-10 pb-10 text-center text-sm text-muted">
          이 달에는 아직 지출 내역이 없습니다.
        </p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-56 w-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="amount"
                  nameKey="categoryName"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                >
                  {items.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.meta.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted">총 지출</span>
              <span className="mt-1 text-base font-bold text-gray-900">
                {formatWon(totalExpense)}
              </span>
            </div>
          </div>

          <ul className="flex w-full flex-1 flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.categoryId}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-gray-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.meta.color }}
                  />
                  {item.meta.label}
                </span>
                <span className="font-medium text-gray-900">
                  {formatWon(item.amount)}{" "}
                  <span className="text-muted">
                    ({totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/dashboard/stats"
        className="mt-6 flex items-center justify-center rounded-xl border border-border py-2.5 text-sm font-medium text-brand hover:bg-brand-soft"
      >
        전체 통계 보기 →
      </Link>
    </div>
  );
}
