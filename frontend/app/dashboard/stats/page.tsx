"use client";

import { useState } from "react";
import MonthlySummaryCards from "@/components/dashboard/MonthlySummaryCards";
import CategorySpendingPanel from "@/components/dashboard/CategorySpendingPanel";
import MonthlyTrendPanel from "@/components/dashboard/MonthlyTrendPanel";
import MonthSelector, { type YearMonth } from "@/components/dashboard/MonthSelector";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";

const TREND_MONTHS = 12;

function currentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default function StatsPage() {
  const [selectedMonth, setSelectedMonth] = useState<YearMonth>(currentYearMonth);
  const { stats, previousStats, trend, isLoading, error, reload } = useMonthlyStats(
    selectedMonth,
    TREND_MONTHS
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-sm text-expense">{error}</p>
        <button
          type="button"
          onClick={reload}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">통계</h1>
          <p className="mt-1 text-sm text-muted">
            월별 수입/지출과 카테고리별 지출을 자세히 확인하세요.
          </p>
        </div>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {isLoading || !stats ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted">
          불러오는 중...
        </div>
      ) : (
        <>
          <MonthlySummaryCards stats={stats} previousStats={previousStats} />
          <MonthlyTrendPanel data={trend} />
          <CategorySpendingPanel
            categoryExpenses={stats.categoryExpenses}
            totalExpense={stats.totalExpense}
          />
        </>
      )}
    </div>
  );
}
