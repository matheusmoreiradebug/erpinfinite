"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell, Calendar, LogOut, ChevronDown } from "lucide-react";
import { navItems } from "@/lib/nav";
import type { CurrentUser } from "@/lib/data/user";

function usePageTitle() {
  const pathname = usePathname();
  const match =
    navItems.find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href))) ??
    navItems[0];
  return match;
}

export function Topbar({
  onOpenMobile,
  user,
}: {
  onOpenMobile: () => void;
  user: CurrentUser;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const page = usePageTitle();
  const hoje = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-ink/80 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={onOpenMobile}
        className="grid size-10 place-items-center rounded-xl text-fg-muted hover:bg-elevated hover:text-fg lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex flex-col leading-tight">
        <h1 className="text-base font-semibold tracking-tight text-fg">{page.label}</h1>
        <p className="hidden text-xs text-fg-subtle sm:block">{page.description}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* busca */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            placeholder="Buscar funcionário, setor…"
            className="h-10 w-56 rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20 lg:w-72"
          />
        </div>

        {/* data */}
        <div className="hidden items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-xs text-fg-muted xl:flex">
          <Calendar className="size-4 text-brand-3" />
          <span className="capitalize">{hoje}</span>
        </div>

        {/* notificações */}
        <button className="relative grid size-10 place-items-center rounded-xl border border-line bg-panel text-fg-muted transition-colors hover:bg-elevated hover:text-fg">
          <Bell className="size-5" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-danger ring-2 ring-panel" />
        </button>

        {/* usuário */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-panel py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-elevated"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-3 text-xs font-semibold text-white">
              {user.initials}
            </span>
            <span className="hidden text-sm font-medium text-fg sm:block">{user.name}</span>
            <ChevronDown className="hidden size-4 text-fg-subtle sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-ink-2 shadow-2xl">
                <div className="border-b border-line px-3.5 py-3">
                  <p className="truncate text-sm font-medium text-fg">{user.name}</p>
                  {user.email && (
                    <p className="truncate text-xs text-fg-subtle">{user.email}</p>
                  )}
                </div>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-fg-muted transition-colors hover:bg-elevated hover:text-danger"
                  >
                    <LogOut className="size-4" />
                    Sair
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
