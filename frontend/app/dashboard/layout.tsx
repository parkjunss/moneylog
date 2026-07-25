import type { ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import RequireAuth from "@/components/auth/RequireAuth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
