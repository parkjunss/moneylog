import {
  Utensils,
  Bus,
  Home,
  Zap,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  Phone,
  Shield,
  PiggyBank,
  MoreHorizontal,
  Briefcase,
  Wallet,
  Gift,
  TrendingUp,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";

export type TransactionType = "INCOME" | "EXPENSE";

export type CategoryMeta = {
  label: string;
  type: TransactionType;
  color: string;
  icon: LucideIcon;
};

// 백엔드 CategoryName enum(raw name)과 1:1로 대응한다.
// MoneyLogResponse.category / CategoryExpenseResponse.categoryName은
// displayName이 아니라 enum의 raw name(.name())을 내려주기 때문에
// 이 키는 반드시 raw name과 일치해야 한다.
export const CATEGORY_META: Record<string, CategoryMeta> = {
  FOOD: { label: "식비", type: "EXPENSE", color: "#6366f1", icon: Utensils },
  TRANSPORTATION: { label: "교통", type: "EXPENSE", color: "#10b981", icon: Bus },
  HOUSING: { label: "주거", type: "EXPENSE", color: "#f59e0b", icon: Home },
  UTILITIES: { label: "공과금", type: "EXPENSE", color: "#0ea5e9", icon: Zap },
  SHOPPING: { label: "쇼핑", type: "EXPENSE", color: "#ec4899", icon: ShoppingBag },
  CULTURE: { label: "문화·여가", type: "EXPENSE", color: "#8b5cf6", icon: Film },
  HEALTH: { label: "의료·건강", type: "EXPENSE", color: "#ef4444", icon: HeartPulse },
  EDUCATION: { label: "교육", type: "EXPENSE", color: "#14b8a6", icon: GraduationCap },
  COMMUNICATION: { label: "통신", type: "EXPENSE", color: "#f97316", icon: Phone },
  INSURANCE: { label: "보험", type: "EXPENSE", color: "#a855f7", icon: Shield },
  SAVINGS: { label: "저축", type: "EXPENSE", color: "#22c55e", icon: PiggyBank },
  ETC_EXPENSE: { label: "기타 지출", type: "EXPENSE", color: "#9ca3af", icon: MoreHorizontal },
  SALARY: { label: "급여", type: "INCOME", color: "#10b981", icon: Briefcase },
  ALLOWANCE: { label: "용돈", type: "INCOME", color: "#06b6d4", icon: Wallet },
  BONUS: { label: "상여금", type: "INCOME", color: "#84cc16", icon: Gift },
  INVESTMENT: { label: "투자 수익", type: "INCOME", color: "#3b82f6", icon: TrendingUp },
  SIDE_INCOME: { label: "부수입", type: "INCOME", color: "#eab308", icon: CircleDollarSign },
  ETC_INCOME: { label: "기타 수입", type: "INCOME", color: "#a3a3a3", icon: MoreHorizontal },
};

const FALLBACK_META: CategoryMeta = {
  label: "기타",
  type: "EXPENSE",
  color: "#9ca3af",
  icon: MoreHorizontal,
};

export function getCategoryMeta(rawName: string): CategoryMeta {
  return CATEGORY_META[rawName] ?? FALLBACK_META;
}
