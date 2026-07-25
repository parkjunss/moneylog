import Link from "next/link";
import type { MoneyLogItem } from "@/lib/api-client";
import { getCategoryMeta } from "@/lib/category-meta";
import { formatWon, formatTransactionDate } from "@/lib/format";

export default function RecentTransactionsTable({
  transactions,
}: {
  transactions: MoneyLogItem[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">최근 거래내역</h2>
        <Link
          href="/dashboard/transactions"
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          거래내역 전체 보기
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="mt-8 pb-4 text-center text-sm text-muted">
          아직 등록된 거래내역이 없습니다.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="pb-3 font-medium">날짜</th>
                <th className="pb-3 font-medium">내역</th>
                <th className="pb-3 font-medium">카테고리</th>
                <th className="pb-3 pr-2 text-right font-medium">금액</th>
                <th className="pb-3 pl-4 text-right font-medium">유형</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const meta = getCategoryMeta(tx.category);
                const Icon = meta.icon;
                const isIncome = tx.type === "INCOME";

                return (
                  <tr key={tx.id} className="border-b border-border last:border-0">
                    <td className="py-3.5 text-gray-500">{formatTransactionDate(tx.date)}</td>
                    <td className="py-3.5 font-medium text-gray-900">{tx.title}</td>
                    <td className="py-3.5">
                      <span className="flex items-center gap-2 text-gray-600">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
                          <Icon size={14} />
                        </span>
                        {meta.label}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 pr-2 text-right font-semibold ${
                        isIncome ? "text-income" : "text-expense"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatWon(Number(tx.money))}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isIncome
                            ? "bg-income-soft text-income"
                            : "bg-expense-soft text-expense"
                        }`}
                      >
                        {isIncome ? "수입" : "지출"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
