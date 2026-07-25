import type { ReactNode } from "react";
import SideNav from "@/components/dashboard/SideNav";
import TopBar from "@/components/dashboard/TopBar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <SideNav />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <TopBar />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
