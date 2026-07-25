"use client";

import { Bell, ChevronDown, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function TopBar() {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-end gap-4 border-b border-border bg-surface px-8 py-4">
      <button
        type="button"
        aria-label="알림"
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-50"
      >
        <Bell size={18} />
      </button>

      <button
        type="button"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
          <UserRound size={16} />
        </span>
        <span className="text-sm font-medium">{user?.username ?? "사용자"} 님</span>
        <ChevronDown size={14} className="text-muted" />
      </button>
    </div>
  );
}
