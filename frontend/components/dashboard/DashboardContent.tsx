"use client";

import { useCallback, useEffect, useState } from "react";
import MonthlySummaryCards from "@/components/dashboard/MonthlySummaryCards";
import CategorySpendingPanel from "@/components/dashboard/CategorySpendingPanel";
import MonthlyTrendPanel from "@/components/dashboard/MonthlyTrendPanel";
import RecentTransactionsTable from "@/components/dashboard/RecentTransactionsTable";
import MonthSelector, { type YearMonth } from "@/components/dashboard/MonthSelector";
import { useAuth } from "@/hooks/useAuth";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import { apiGetRecentMoneyLogs, type MoneyLogItem } from "@/lib/api-client";

const TREND_MONTHS = 6;

function currentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default function DashboardContent() {
  const { accessToken } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<YearMonth>(currentYearMonth);
  const { stats, previousStats, trend, isLoading, error, reload } = useMonthlyStats(
    selectedMonth,
    TREND_MONTHS
  );
  const [transactions, setTransactions] = useState<MoneyLogItem[]>([]);

  const loadTransactions = useCallback(async () => {
    if (!accessToken) return;
    try {
      const recentLogs = await apiGetRecentMoneyLogs(accessToken, 5);
      setTransactions(recentLogs.content);
    } catch {
      // 최근 거래내역은 부가 정보라 실패해도 통계 화면을 막지 않는다.
    }
  }, [accessToken]);

  useEffect(() => {
    // 백엔드(외부 시스템)에서 최근 거래내역을 가져와 동기화하는 것이라 useEffect가 적절함.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTransactions();
  }, [loadTransactions]);

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
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-1 text-sm text-muted">내 돈의 흐름을 한눈에 확인하세요.</p>
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

          <div className="flex flex-col gap-4 lg:flex-row">
            <CategorySpendingPanel
              categoryExpenses={stats.categoryExpenses}
              totalExpense={stats.totalExpense}
            />
            <MonthlyTrendPanel data={trend} />
          </div>

          <RecentTransactionsTable transactions={transactions} />
        </>
      )}
    </div>
  );
}
