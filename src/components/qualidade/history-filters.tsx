"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { inputClass } from "@/components/ui/dialog";
import type { QualityCatalogs } from "@/lib/data/quality";

export function HistoryFilters({ catalogs }: { catalogs: QualityCatalogs }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const sel = (key: string) => sp.get(key) ?? "";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <select value={sel("status")} onChange={(e) => setParam("status", e.target.value)} className={inputClass}>
        <option value="">Todos os status</option>
        <option value="registrado">Registrado</option>
        <option value="classificado">Classificado</option>
        <option value="resolvido">Resolvido</option>
      </select>
      <select value={sel("setor")} onChange={(e) => setParam("setor", e.target.value)} className={inputClass}>
        <option value="">Todos os setores</option>
        {catalogs.sectors.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
      </select>
      <select value={sel("funcionario")} onChange={(e) => setParam("funcionario", e.target.value)} className={inputClass}>
        <option value="">Todos os funcionários</option>
        {catalogs.employees.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
      </select>
      <select value={sel("caminhao")} onChange={(e) => setParam("caminhao", e.target.value)} className={inputClass}>
        <option value="">Todos os caminhões</option>
        {catalogs.trucks.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
      </select>
      <select value={sel("categoria")} onChange={(e) => setParam("categoria", e.target.value)} className={inputClass}>
        <option value="">Todas as categorias</option>
        {catalogs.categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
    </div>
  );
}
