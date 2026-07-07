import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { DateRange } from "@/lib/date-range";

export type FlowStage = { id: string; nome: string; slug: string; ordem: number; etapaFinal: boolean; cor: string };

/** Etapas do fluxo = setores com ordem_fluxo, em ordem. */
export const getFlowStages = cache(async (): Promise<FlowStage[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("sectors")
    .select("id, nome, slug, ordem_fluxo, etapa_final, cor")
    .eq("ativo", true)
    .not("ordem_fluxo", "is", null)
    .order("ordem_fluxo", { ascending: true });
  return (data ?? []).map((s) => ({
    id: s.id, nome: s.nome, slug: s.slug, ordem: s.ordem_fluxo ?? 0,
    etapaFinal: s.etapa_final, cor: s.cor ?? "#6b7280",
  }));
});

export type FlowListSummary = {
  id: string; codigo: string; dataProducao: string; status: string;
  totalPecas: number; produzido: number; pct: number; // produzido = etapa final
};

/** Listas ativas (não finalizadas) com resumo de progresso pela etapa final. */
export const getActiveFlowLists = cache(async (): Promise<FlowListSummary[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const stages = await getFlowStages();
  const finalId = stages.find((s) => s.etapaFinal)?.id ?? null;

  const { data: lists } = await supabase
    .from("production_lists")
    .select("id, codigo, data_producao, status")
    .neq("status", "finalizada")
    .order("created_at", { ascending: false });
  if (!lists?.length) return [];

  const { data: items } = await supabase
    .from("production_list_items")
    .select("id, list_id, quantidade")
    .in("list_id", lists.map((l) => l.id));
  const itemsByList = new Map<string, { id: string; qtd: number }[]>();
  const itemList = new Map<string, string>();
  for (const it of items ?? []) {
    const arr = itemsByList.get(it.list_id) ?? [];
    arr.push({ id: it.id, qtd: it.quantidade });
    itemsByList.set(it.list_id, arr);
    itemList.set(it.id, it.list_id);
  }

  // marcações da etapa final por lista
  const producedByList = new Map<string, number>();
  if (finalId && items?.length) {
    const { data: marks } = await supabase
      .from("list_item_stages")
      .select("list_item_id, quantidade")
      .eq("setor_id", finalId)
      .in("list_item_id", items.map((i) => i.id));
    for (const m of marks ?? []) {
      const lid = itemList.get(m.list_item_id);
      if (lid) producedByList.set(lid, (producedByList.get(lid) ?? 0) + m.quantidade);
    }
  }

  return lists.map((l) => {
    const its = itemsByList.get(l.id) ?? [];
    const totalPecas = its.reduce((a, i) => a + i.qtd, 0);
    const produzido = producedByList.get(l.id) ?? 0;
    return { id: l.id, codigo: l.codigo, dataProducao: l.data_producao, status: l.status, totalPecas, produzido, pct: totalPecas ? produzido / totalPecas : 0 };
  });
});

export type FlowItem = {
  id: string; linha: string; caminhao: number | null; cor: "branco" | "preto"; movel: string; quantidade: number;
  progresso: Record<string, number>; // setor_id -> quantidade concluída
};

/** Itens de uma lista com o progresso por etapa. */
export const getListaFlow = cache(async (listId: string): Promise<{ itens: FlowItem[]; stages: FlowStage[] } | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const stages = await getFlowStages();

  const { data: items } = await supabase
    .from("production_list_items")
    .select("id, linha, caminhao, cor, movel, quantidade, ordem")
    .eq("list_id", listId)
    .order("ordem", { ascending: true });
  if (!items) return null;

  const { data: marks } = await supabase
    .from("list_item_stages")
    .select("list_item_id, setor_id, quantidade")
    .in("list_item_id", items.map((i) => i.id));
  const byItem = new Map<string, Record<string, number>>();
  for (const m of marks ?? []) {
    const rec = byItem.get(m.list_item_id) ?? {};
    rec[m.setor_id] = m.quantidade;
    byItem.set(m.list_item_id, rec);
  }

  return {
    stages,
    itens: items.map((i) => ({
      id: i.id, linha: i.linha, caminhao: i.caminhao, cor: i.cor as "branco" | "preto",
      movel: i.movel, quantidade: i.quantidade, progresso: byItem.get(i.id) ?? {},
    })),
  };
});

export type FlowProduction = {
  producaoReal: number; // etapa final, conta 1×
  totalPlanejado: number;
  porSetor: { setor: string; cor: string; ordem: number; etapaFinal: boolean; quantidade: number }[]; // produtividade
  listas: number;
  semVazio: boolean;
};

/** Dashboard do fluxo por período (por data_producao da lista). */
export const getFlowProduction = cache(async (range: DateRange): Promise<FlowProduction> => {
  const zero: FlowProduction = { producaoReal: 0, totalPlanejado: 0, porSetor: [], listas: 0, semVazio: true };
  if (!isSupabaseConfigured) return zero;
  const supabase = await createClient();
  const stages = await getFlowStages();
  const finalId = stages.find((s) => s.etapaFinal)?.id ?? null;

  const { data: lists } = await supabase
    .from("production_lists")
    .select("id")
    .gte("data_producao", range.from)
    .lte("data_producao", range.to);
  if (!lists?.length) return zero;

  const { data: items } = await supabase
    .from("production_list_items")
    .select("id, quantidade")
    .in("list_id", lists.map((l) => l.id));
  if (!items?.length) return { ...zero, listas: lists.length };
  const totalPlanejado = items.reduce((a, i) => a + i.quantidade, 0);

  const { data: marks } = await supabase
    .from("list_item_stages")
    .select("setor_id, quantidade")
    .in("list_item_id", items.map((i) => i.id));

  const porSetorMap = new Map<string, number>();
  let producaoReal = 0;
  for (const m of marks ?? []) {
    porSetorMap.set(m.setor_id, (porSetorMap.get(m.setor_id) ?? 0) + m.quantidade);
    if (m.setor_id === finalId) producaoReal += m.quantidade;
  }

  const porSetor = stages.map((s) => ({
    setor: s.nome, cor: s.cor, ordem: s.ordem, etapaFinal: s.etapaFinal,
    quantidade: porSetorMap.get(s.id) ?? 0,
  }));

  return { producaoReal, totalPlanejado, porSetor, listas: lists.length, semVazio: (marks?.length ?? 0) === 0 };
});
