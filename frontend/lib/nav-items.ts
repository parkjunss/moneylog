import {
  LayoutDashboard,
  List,
  BarChart3,
  Grid2x2,
  Wallet,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const navItems: NavItem[] = [
  { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { label: "거래내역", href: "/dashboard/transactions", icon: List },
  { label: "통계", href: "/dashboard/stats", icon: BarChart3 },
  { label: "카테고리", href: "/dashboard/categories", icon: Grid2x2 },
  { label: "예산", href: "/dashboard/budget", icon: Wallet, badge: "준비중" },
  { label: "설정", href: "/dashboard/settings", icon: Settings },
];
