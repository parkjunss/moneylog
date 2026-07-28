"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navItems } from "@/lib/nav-items";
import { useAuth } from "@/hooks/useAuth";

export default function SideNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    // 로그인 페이지의 "이미 인증됨" 가드가 아직 갱신 전인 context 상태를 읽고
    // 대시보드로 되튕기는 race를 피하기 위해 완전한 페이지 이동을 사용한다.
    window.location.href = "/login";
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6">
      <Link href="/dashboard" className="flex items-center gap-3 px-2 pb-8">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--brand-start), var(--brand-end))",
          }}
        >
          M
        </span>
        <span>
          <span className="block text-lg font-bold leading-tight">머니로그</span>
          <span className="block text-xs leading-tight text-muted">
            내 돈의 흐름을 한눈에
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-soft text-brand"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </span>
              {item.badge && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-muted">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
      >
        <LogOut size={18} strokeWidth={2} />
        로그아웃
      </button>
    </aside>
  );
}
