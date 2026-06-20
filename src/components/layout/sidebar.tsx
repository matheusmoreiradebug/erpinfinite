"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { visibleNav, type NavItem } from "@/lib/nav";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/types";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  role: UserRole;
};

const sectionLabel: Record<string, string> = {
  producao: "Produção",
  qualidade: "Qualidade",
};

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile, role }: SidebarProps) {
  const pathname = usePathname();
  const items = visibleNav(role);
  const grupos: Record<string, NavItem[]> = {};
  for (const it of items) (grupos[it.section ?? "producao"] ??= []).push(it);

  return (
    <>
      {/* overlay mobile */}
      <div
        onClick={onCloseMobile}
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-ink-2/95 backdrop-blur-xl transition-all duration-300 lg:translate-x-0",
          collapsed ? "w-[76px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* brand */}
        <div className="flex h-16 items-center gap-3 border-b border-line px-4">
          <BrandLogo size={40} />
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight text-fg">Infinite</span>
              <span className="text-[11px] text-fg-subtle">Dashboard</span>
            </div>
          )}
        </div>

        {/* nav */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {Object.entries(grupos).map(([sec, secItems]) => (
            <div key={sec} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                  {sectionLabel[sec] ?? sec}
                </p>
              )}
              {secItems.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                      active
                        ? "bg-brand/12 text-fg"
                        : "text-fg-muted hover:bg-elevated hover:text-fg",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
                    )}
                    <Icon
                      className={cn(
                        "size-5 shrink-0 transition-colors",
                        active ? "text-brand-3" : "text-fg-subtle group-hover:text-fg",
                      )}
                      strokeWidth={2}
                    />
                    {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* footer / toggle */}
        <div className="border-t border-line p-3">
          <button
            onClick={onToggle}
            className="hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-fg-muted transition-colors hover:bg-elevated hover:text-fg lg:flex"
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                Recolher
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
