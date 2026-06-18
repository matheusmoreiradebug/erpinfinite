"use client";

import { useEffect, useState } from "react";
import { Bell, AlertOctagon, AlertTriangle, Info, CheckCheck } from "lucide-react";
import type { NotificationItem } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "infinite_seen_notifs";

const nivelStyle = {
  critico: { Icon: AlertOctagon, color: "text-danger", dot: "bg-danger" },
  alerta: { Icon: AlertTriangle, color: "text-warning", dot: "bg-warning" },
  info: { Icon: Info, color: "text-brand-3", dot: "bg-brand" },
} as const;

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function NotificationsBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);

  useEffect(() => {
    setSeen(readSeen());
    setMounted(true);
  }, []);

  const unread = mounted ? notifications.filter((n) => !seen.includes(n.id)) : [];

  const markAllRead = () => {
    const ids = notifications.map((n) => n.id);
    setSeen(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread.length) markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative grid size-10 place-items-center rounded-xl border border-line bg-panel text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
        aria-label="Notificações"
      >
        <Bell className="size-5" />
        {mounted && unread.length > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-ink">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-ink-2 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
              <p className="text-sm font-medium text-fg">Notificações</p>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-fg-subtle transition-colors hover:text-brand-3"
                >
                  <CheckCheck className="size-3.5" />
                  Marcar lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <CheckCheck className="size-6 text-success" />
                  <p className="text-sm text-fg-muted">Tudo em dia. Nenhuma notificação.</p>
                </div>
              ) : (
                <ul className="divide-y divide-line/60">
                  {notifications.map((n) => {
                    const { Icon, color, dot } = nivelStyle[n.nivel];
                    const isUnread = !seen.includes(n.id);
                    return (
                      <li
                        key={n.id}
                        className={cn(
                          "flex gap-3 px-3.5 py-3 transition-colors hover:bg-elevated/50",
                          isUnread && "bg-brand/[0.04]",
                        )}
                      >
                        <Icon className={cn("mt-0.5 size-4.5 shrink-0", color)} />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-sm font-medium text-fg">
                            {n.titulo}
                            {isUnread && <span className={cn("size-1.5 rounded-full", dot)} />}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
                            {n.mensagem}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
