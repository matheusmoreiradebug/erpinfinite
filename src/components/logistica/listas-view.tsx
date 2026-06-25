"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Copy, Loader2, FileText, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import { statusLabel, statusCor, prioridadeLabel, prioridadeCor, STATUS_LISTA } from "@/lib/logistica";
import type { ListaResumo } from "@/lib/data/listas";
import { criarLista, duplicarLista, excluirLista } from "@/app/(app)/logistica/actions";

const br = (iso: string) => iso.split("-").reverse().join("/");

export function ListasView({ listas }: { listas: ListaResumo[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtradas = useMemo(
    () =>
      listas.filter((l) => {
        const okBusca =
          !busca ||
          l.codigo.toLowerCase().includes(busca.toLowerCase()) ||
          l.cliente.toLowerCase().includes(busca.toLowerCase()) ||
          (l.pedido ?? "").toLowerCase().includes(busca.toLowerCase());
        return okBusca && (!filtro || l.status === filtro);
      }),
    [listas, busca, filtro],
  );

  const nova = () =>
    startTransition(async () => {
      const r = await criarLista();
      if (r.ok && r.id) router.push(`/logistica/${r.id}`);
    });

  const duplicar = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const r = await duplicarLista(id);
      setBusyId(null);
      if (r.ok && r.id) router.push(`/logistica/${r.id}`);
    });
  };

  const excluir = (id: string) => {
    if (!confirm("Excluir esta lista? Não pode ser desfeito.")) return;
    setBusyId(id);
    startTransition(async () => {
      await excluirLista(id);
      setBusyId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar código, cliente, pedido…"
              className="h-10 w-64 rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-fg focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Todos os status</option>
            {STATUS_LISTA.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
        <Button onClick={nova} disabled={pending}>
          {pending && !busyId ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Nova lista
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Produção</th>
                <th className="px-4 py-3 font-medium">Entrega</th>
                <th className="px-4 py-3 text-right font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Prioridade</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((l) => (
                <tr key={l.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-elevated/50">
                  <td className="px-4 py-3">
                    <Link href={`/logistica/${l.id}`} className="font-medium text-brand-3 hover:underline">
                      {l.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fg">{l.cliente}</td>
                  <td className="px-4 py-3 text-fg-muted">{l.pedido ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">{br(l.dataProducao)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">{l.dataEntrega ? br(l.dataEntrega) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-fg">{formatNumber(l.totalQtd)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: prioridadeCor(l.prioridade) }}>
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: prioridadeCor(l.prioridade) }} />
                      {prioridadeLabel(l.prioridade)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{ color: statusCor(l.status), borderColor: statusCor(l.status) + "55", backgroundColor: statusCor(l.status) + "18" }}
                    >
                      {statusLabel(l.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/logistica/${l.id}`}>
                        <span className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-elevated hover:text-fg"><FileText className="size-3.5" /></span>
                      </Link>
                      <button
                        onClick={() => duplicar(l.id)}
                        disabled={pending && busyId === l.id}
                        className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-elevated hover:text-fg"
                        title="Duplicar"
                      >
                        {pending && busyId === l.id ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
                      </button>
                      <button
                        onClick={() => excluir(l.id)}
                        className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-danger/15 hover:text-danger"
                        title="Excluir"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-fg-muted">
                    Nenhuma lista. Clique em “Nova lista” para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
