"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Truck, Save, Loader2, Check, FileText, Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/dialog";
import { cn, formatNumber } from "@/lib/utils";
import { LINHAS, CAMINHOES, STATUS_LISTA, PRIORIDADES, statusCor } from "@/lib/logistica";
import type { ListaCompleta } from "@/lib/data/listas";
import type { ListStatus, ListPriority } from "@/lib/supabase/types";
import { salvarLista, duplicarLista, type ListaItemInput } from "@/app/(app)/logistica/actions";

type Row = { key: string; linha: string; caminhao: number; cor: "branco" | "preto"; movel: string; quantidade: string };
let counter = 0;
const k = () => `r${counter++}`;

export function ListaEditor({
  lista,
  clientes,
  sugestoes,
}: {
  lista: ListaCompleta;
  clientes: { id: string; nome: string }[];
  sugestoes: string[];
}) {
  const router = useRouter();

  // cabeçalho
  const [dataProducao, setDataProducao] = useState(lista.dataProducao);
  const [dataEntrega, setDataEntrega] = useState(lista.dataEntrega ?? "");
  const [clientId, setClientId] = useState(lista.clientId ?? "");
  const [clienteNovo, setClienteNovo] = useState(lista.clientId ? "" : lista.clienteNome ?? "");
  const [usarNovo, setUsarNovo] = useState(!lista.clientId && !!lista.clienteNome);
  const [pedido, setPedido] = useState(lista.pedido ?? "");
  const [prioridade, setPrioridade] = useState<ListPriority>(lista.prioridade);
  const [status, setStatus] = useState<ListStatus>(lista.status);
  const [observacao, setObservacao] = useState(lista.observacao ?? "");

  // itens + linha ativa
  const [rows, setRows] = useState<Row[]>(
    lista.itens.map((i) => ({
      key: k(),
      linha: i.linha,
      caminhao: i.caminhao ?? 1,
      cor: i.cor,
      movel: i.movel,
      quantidade: String(i.quantidade),
    })),
  );
  const [linhaAtiva, setLinhaAtiva] = useState<string>(LINHAS[0].key);

  const [salvando, setSalvando] = useState(false);
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildPayload = useCallback(() => {
    const header = {
      dataProducao,
      dataEntrega: dataEntrega || null,
      clientId: usarNovo ? null : clientId || null,
      clienteNome: usarNovo ? clienteNovo || null : null,
      pedido: pedido || null,
      prioridade,
      status,
      observacao: observacao || null,
    };
    const itens: ListaItemInput[] = rows
      .filter((r) => r.movel.trim() && Number(r.quantidade) > 0)
      .map((r) => ({ linha: r.linha, caminhao: r.caminhao, cor: r.cor, movel: r.movel.trim(), quantidade: Number(r.quantidade) }));
    return { header, itens };
  }, [dataProducao, dataEntrega, clientId, clienteNovo, usarNovo, pedido, prioridade, status, observacao, rows]);

  const salvar = useCallback(
    async (silent: boolean) => {
      setErro(null);
      setSalvando(true);
      const { header, itens } = buildPayload();
      const res = await salvarLista(lista.id, header, itens);
      setSalvando(false);
      if (res.ok) {
        dirty.current = false;
        setSalvoEm(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
        if (!silent) router.refresh();
      } else setErro(res.error ?? "Erro ao salvar.");
    },
    [buildPayload, lista.id, router],
  );

  // autosave (debounce) — dispara após edição
  useEffect(() => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => salvar(true), 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [rows, dataProducao, dataEntrega, clientId, clienteNovo, usarNovo, pedido, prioridade, status, observacao, salvar]);

  const marcar = () => (dirty.current = true);
  const addRow = (caminhao: number) => {
    marcar();
    setRows((rs) => [...rs, { key: k(), linha: linhaAtiva, caminhao, cor: "branco", movel: "", quantidade: "" }]);
  };
  const upd = (key: string, patch: Partial<Row>) => {
    marcar();
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  const del = (key: string) => {
    marcar();
    setRows((rs) => rs.filter((r) => r.key !== key));
  };

  const totalLinha = rows.filter((r) => r.linha === linhaAtiva).reduce((a, r) => a + (Number(r.quantidade) || 0), 0);
  const totalGeral = rows.reduce((a, r) => a + (Number(r.quantidade) || 0), 0);

  const duplicar = () =>
    startTransition(async () => {
      const r = await duplicarLista(lista.id);
      if (r.ok && r.id) router.push(`/logistica/${r.id}`);
    });

  return (
    <div className="space-y-4">
      {/* topo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/logistica">
            <span className="grid size-9 place-items-center rounded-xl border border-line bg-elevated text-fg-muted hover:bg-line-2 hover:text-fg"><ArrowLeft className="size-4" /></span>
          </Link>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-fg">{lista.codigo}</h2>
            <p className="text-xs text-fg-subtle">
              {salvando ? "Salvando…" : salvoEm ? `Salvo às ${salvoEm}` : "Edição automática ativa"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={duplicar} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />} Duplicar
          </Button>
          <a href={`/api/lista-pdf?id=${lista.id}`} target="_blank" rel="noreferrer">
            <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-elevated px-3 text-sm font-medium text-fg hover:bg-line-2">
              <FileText className="size-4" /> PDF
            </span>
          </a>
          <Button size="sm" onClick={() => salvar(false)} disabled={salvando}>
            {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
          </Button>
        </div>
      </div>

      {erro && <p className="text-xs text-danger">{erro}</p>}

      {/* cabeçalho */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-3 p-5 md:grid-cols-3 lg:grid-cols-4">
          <Field label="Data de produção">
            <input type="date" value={dataProducao} onChange={(e) => { marcar(); setDataProducao(e.target.value); }} className={inputClass} />
          </Field>
          <Field label="Entrega prevista">
            <input type="date" value={dataEntrega} onChange={(e) => { marcar(); setDataEntrega(e.target.value); }} className={inputClass} />
          </Field>
          <Field label="Cliente">
            {usarNovo ? (
              <div className="flex gap-1">
                <input value={clienteNovo} onChange={(e) => { marcar(); setClienteNovo(e.target.value); }} placeholder="Novo cliente" className={inputClass} autoFocus />
                <button type="button" onClick={() => { setUsarNovo(false); marcar(); }} className="shrink-0 rounded-xl border border-line px-2 text-xs text-fg-subtle hover:bg-elevated">×</button>
              </div>
            ) : (
              <select
                value={clientId}
                onChange={(e) => { marcar(); if (e.target.value === "__novo__") { setUsarNovo(true); setClientId(""); } else setClientId(e.target.value); }}
                className={inputClass}
              >
                <option value="">Selecione…</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                <option value="__novo__">+ Novo cliente…</option>
              </select>
            )}
          </Field>
          <Field label="Pedido">
            <input value={pedido} onChange={(e) => { marcar(); setPedido(e.target.value); }} placeholder="Nº do pedido" className={inputClass} />
          </Field>
          <Field label="Prioridade">
            <select value={prioridade} onChange={(e) => { marcar(); setPrioridade(e.target.value as ListPriority); }} className={inputClass}>
              {PRIORIDADES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => { marcar(); setStatus(e.target.value as ListStatus); }} className={inputClass} style={{ color: statusCor(status) }}>
              {STATUS_LISTA.map((s) => <option key={s.key} value={s.key} style={{ color: "var(--color-fg)" }}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Observação" hint="Aparece no PDF">
            <input value={observacao} onChange={(e) => { marcar(); setObservacao(e.target.value); }} placeholder="Ex.: prioridade no caminhão 3" className={inputClass} />
          </Field>
        </CardContent>
      </Card>

      {/* itens por linha */}
      <datalist id="moveis-lp">{sugestoes.map((s) => <option key={s} value={s} />)}</datalist>

      <div className="flex flex-wrap items-center gap-2">
        {LINHAS.map((l) => {
          const n = rows.filter((r) => r.linha === l.key && r.movel.trim()).length;
          return (
            <button
              key={l.key}
              onClick={() => setLinhaAtiva(l.key)}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                l.key === linhaAtiva ? "border-brand bg-brand/15 text-fg" : "border-line text-fg-muted hover:bg-elevated hover:text-fg",
              )}
            >
              {l.label}{n > 0 && <span className="ml-1.5 text-xs text-fg-subtle">({n})</span>}
            </button>
          );
        })}
        <span className="ml-auto text-sm text-fg-muted">Linha: <b className="text-fg">{formatNumber(totalLinha)}</b> · Total: <b className="text-fg">{formatNumber(totalGeral)}</b></span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {CAMINHOES.map((cam) => {
          const itens = rows.filter((r) => r.linha === linhaAtiva && r.caminhao === cam);
          const totalCam = itens.reduce((a, r) => a + (Number(r.quantidade) || 0), 0);
          return (
            <Card key={cam}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-fg"><Truck className="size-4 text-brand-3" /> Caminhão {cam}</span>
                  <span className="text-xs text-fg-subtle">{formatNumber(totalCam)} pç</span>
                </div>
                <div className="space-y-2">
                  {itens.map((r) => (
                    <div key={r.key} className="grid grid-cols-[1fr_88px_64px_32px] items-center gap-2">
                      <input list="moveis-lp" value={r.movel} onChange={(e) => upd(r.key, { movel: e.target.value })} placeholder="Móvel" className={cn(inputClass, "h-9")} />
                      <div className="flex rounded-lg border border-line p-0.5">
                        {(["branco", "preto"] as const).map((c) => (
                          <button key={c} type="button" onClick={() => upd(r.key, { cor: c })}
                            className={cn("flex-1 rounded-md py-1 text-[11px] font-medium transition-colors", r.cor === c ? (c === "branco" ? "bg-fg text-ink" : "bg-ink-2 text-fg ring-1 ring-line-2") : "text-fg-subtle hover:text-fg")}>
                            {c === "branco" ? "Branco" : "Preto"}
                          </button>
                        ))}
                      </div>
                      <input type="number" min={1} value={r.quantidade} onChange={(e) => upd(r.key, { quantidade: e.target.value.replace(/\D/g, "") })} placeholder="Qtd" className={cn(inputClass, "h-9 px-2 text-center")} />
                      <button onClick={() => del(r.key)} className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-danger/15 hover:text-danger"><Trash2 className="size-3.5" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addRow(cam)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs font-medium text-fg-muted transition-colors hover:border-brand/40 hover:text-fg">
                  <Plus className="size-3.5" /> Adicionar móvel
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
