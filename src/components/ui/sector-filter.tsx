"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Boxes } from "lucide-react";

type Option = { id: string; nome: string };

export function SectorFilter({ sectors }: { sectors: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const onChange = (value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set("setor", value);
    else params.delete("setor");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative">
      <Boxes className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-3" />
      <select
        value={sp.get("setor") ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-xl border border-line bg-elevated pl-9 pr-8 text-sm font-medium text-fg focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        <option value="">Todos os setores</option>
        {sectors.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
