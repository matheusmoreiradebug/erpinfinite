"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function ScopeToggle({ current }: { current: "meus" | "todos" }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const go = (value: "meus" | "todos") => {
    const params = new URLSearchParams(sp.toString());
    params.set("escopo", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-xl border border-line bg-panel p-0.5">
      {(["meus", "todos"] as const).map((v) => (
        <button
          key={v}
          onClick={() => go(v)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
            current === v ? "bg-brand text-white" : "text-fg-muted hover:text-fg",
          )}
        >
          {v === "meus" ? "Meus" : "Todos"}
        </button>
      ))}
    </div>
  );
}
