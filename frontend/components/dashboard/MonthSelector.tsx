"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export type YearMonth = { year: number; month: number };

function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export default function MonthSelector({
  value,
  onChange,
}: {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-surface px-2 py-1.5">
      <button
        type="button"
        aria-label="이전 달"
        onClick={() => onChange(shiftMonth(value, -1))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="flex items-center gap-2 px-2 text-sm font-medium text-gray-900">
        <Calendar size={14} className="text-brand" />
        {value.year}년 {value.month}월
      </span>
      <button
        type="button"
        aria-label="다음 달"
        onClick={() => onChange(shiftMonth(value, 1))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
