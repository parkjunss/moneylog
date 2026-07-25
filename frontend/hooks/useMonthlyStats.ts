"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiGetMonthlyStatistics, ApiError, type MonthlyStatistics } from "@/lib/api-client";
import type { YearMonth } from "@/components/dashboard/MonthSelector";
import type { TrendPoint } from "@/components/dashboard/MonthlyTrendPanel";

function lastNMonths(end: YearMonth, n: number): YearMonth[] {
  const result: YearMonth[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const total = end.year * 12 + (end.month - 1) - i;
    result.push({ year: Math.floor(total / 12), month: (total % 12) + 1 });
  }
  return result;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function useMonthlyStats(selectedMonth: YearMonth, trendMonths: number) {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<MonthlyStatistics | null>(null);
  const [previousStats, setPreviousStats] = useState<MonthlyStatistics | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const months = lastNMonths(selectedMonth, trendMonths);
      const statsResults = await Promise.all(
        months.map((ym) => apiGetMonthlyStatistics(accessToken, ym.year, ym.month))
      );

      setStats(statsResults[statsResults.length - 1]);
      setPreviousStats(statsResults[statsResults.length - 2] ?? null);
      setTrend(
        months.map((ym, index) => ({
          label: `${ym.month}월`,
          income: statsResults[index].totalIncome,
          expense: statsResults[index].totalExpense,
        }))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, selectedMonth, trendMonths]);

  useEffect(() => {
    // 백엔드(외부 시스템)에서 통계를 가져와 동기화하는 것이라 useEffect가 적절함.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { stats, previousStats, trend, isLoading, error, reload: load };
}
