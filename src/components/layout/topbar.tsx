"use client";

import { usePathname } from "next/navigation";
import { Menu, Search, Bell, Calendar } from "lucide-react";
import { navItems } from "@/lib/nav";

function usePageTitle() {
  const pathname = usePathname();
  const match =
    navItems.find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href))) ??
    navItems[0];
  return match;
}

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
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
        <button className="flex items-center gap-2.5 rounded-xl border border-line bg-panel py-1.5 pl-1.5 pr-3 transition-colors hover:bg-elevated">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-3 text-xs font-semibold text-white">
            MM
          </span>
          <span className="hidden text-sm font-medium text-fg sm:block">Matheus</span>
        </button>
      </div>
    </header>
  );
}
