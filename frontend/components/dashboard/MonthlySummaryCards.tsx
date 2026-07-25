import { Briefcase, CreditCard, PieChart } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { percentChange } from "@/hooks/useMonthlyStats";
import { formatWon, formatWonDiff } from "@/lib/format";
import type { MonthlyStatistics } from "@/lib/api-client";

function percentLabel(current: number, previous: number): { label: string; isPositive: boolean } {
  const change = percentChange(current, previous);
  return { label: `${change >= 0 ? "+" : ""}${change}%`, isPositive: change >= 0 };
}

export default function MonthlySummaryCards({
  stats,
  previousStats,
}: {
  stats: MonthlyStatistics;
  previousStats: MonthlyStatistics | null;
}) {
  const income = previousStats
    ? percentLabel(stats.totalIncome, previousStats.totalIncome)
    : { label: "이전 달 데이터 없음", isPositive: true };
  const expense = previousStats
    ? percentLabel(stats.totalExpense, previousStats.totalExpense)
    : { label: "이전 달 데이터 없음", isPositive: true };

  const balanceDiff = previousStats ? stats.balance - previousStats.balance : 0;
  const balance = previousStats
    ? { label: `${formatWonDiff(balanceDiff)}`, isPositive: balanceDiff >= 0 }
    : { label: "이전 달 데이터 없음", isPositive: true };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <StatCard
        label="총 수입"
        value={formatWon(stats.totalIncome)}
        changeLabel={income.label}
        isPositive={income.isPositive}
        tone="income"
        icon={Briefcase}
      />
      <StatCard
        label="총 지출"
        value={formatWon(stats.totalExpense)}
        changeLabel={expense.label}
        isPositive={expense.isPositive}
        tone="expense"
        icon={CreditCard}
      />
      <StatCard
        label="잔액"
        value={formatWon(stats.balance)}
        changeLabel={balance.label}
        isPositive={balance.isPositive}
        tone="balance"
        icon={PieChart}
      />
    </div>
  );
}
