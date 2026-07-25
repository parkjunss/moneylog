import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";

type Tone = "income" | "expense" | "balance";

const toneStyles: Record<Tone, { text: string; iconBg: string }> = {
  income: { text: "text-income", iconBg: "bg-income-soft text-income" },
  expense: { text: "text-expense", iconBg: "bg-expense-soft text-expense" },
  balance: { text: "text-balance", iconBg: "bg-balance-soft text-balance" },
};

export default function StatCard({
  label,
  value,
  changeLabel,
  isPositive,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  changeLabel: string;
  isPositive: boolean;
  tone: Tone;
  icon: LucideIcon;
}) {
  const styles = toneStyles[tone];

  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.iconBg}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className={`mt-3 text-2xl font-bold ${styles.text}`}>{value}</p>
      <p
        className={`mt-2 flex items-center gap-1 text-xs font-medium ${
          isPositive ? "text-income" : "text-expense"
        }`}
      >
        {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        지난달 대비 {changeLabel}
      </p>
    </div>
  );
}
