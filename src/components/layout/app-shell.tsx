"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/data/user";
import type { NotificationItem } from "@/lib/data/queries";

export function AppShell({
  children,
  user,
  notifications,
}: {
  children: React.ReactNode;
  user: CurrentUser;
  notifications: NotificationItem[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          collapsed ? "lg:pl-[76px]" : "lg:pl-64",
        )}
      >
        <Topbar
          onOpenMobile={() => setMobileOpen(true)}
          user={user}
          notifications={notifications}
        />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
