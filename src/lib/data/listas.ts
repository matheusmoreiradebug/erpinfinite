import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ListStatus, ListPriority } from "@/lib/supabase/types";

export type ListaItem = {
  id: string;
  linha: string;
  caminhao: number | null;
  cor: "branco" | "preto";
  movel: string;
  quantidade: number;
  ordem: number | null;
};

export type ListaHeader = {
  id: string;
  codigo: string;
  dataProducao: string;
  dataEntrega: string | null;
  clientId: string | null;
  clienteNome: string | null;
  pedido: string | null;
  prioridade: ListPriority;
  status: ListStatus;
  observacao: string | null;
};

export type ListaResumo = ListaHeader & { totalItens: number; totalQtd: number; cliente: string };
export type ListaCompleta = ListaHeader & { cliente: string; itens: ListaItem[] };

export type ListaFilters = { status?: ListStatus; busca?: string };

/** Lista (histórico) de Listas de Produção, com filtros. */
export const getListas = cache(async (filters: ListaFilters = {}): Promise<ListaResumo[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();

  let q = supabase
    .from("production_lists")
    .select(
      "id, codigo, data_producao, data_entrega, client_id, cliente_nome, pedido, prioridade, status, observacao",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (filters.status) q = q.eq("status", filters.status);

  const [listsRes, clients, itemRes] = await Promise.all([
    q,
    supabase.from("clients").select("id, nome"),
    supabase.from("production_list_items").select("list_id, quantidade"),
  ]);

  const clientNome = new Map((clients.data ?? []).map((c) => [c.id, c.nome]));
  const porLista = new Map<string, { n: number; qtd: number }>();
  for (const it of itemRes.data ?? []) {
    const cur = porLista.get(it.list_id) ?? { n: 0, qtd: 0 };
    cur.n += 1;
    cur.qtd += it.quantidade;
    porLista.set(it.list_id, cur);
  }

  let rows = (listsRes.data ?? []).map((l) => {
    const agg = porLista.get(l.id) ?? { n: 0, qtd: 0 };
    const cliente = l.client_id ? (clientNome.get(l.client_id) ?? "—") : l.cliente_nome || "—";
    return {
      id: l.id,
      codigo: l.codigo,
      dataProducao: l.data_producao,
      dataEntrega: l.data_entrega,
      clientId: l.client_id,
      clienteNome: l.cliente_nome,
      pedido: l.pedido,
      prioridade: l.prioridade,
      status: l.status,
      observacao: l.observacao,
      cliente,
      totalItens: agg.n,
      totalQtd: agg.qtd,
    };
  });

  if (filters.busca) {
    const b = filters.busca.toLowerCase();
    rows = rows.filter(
      (r) => r.codigo.toLowerCase().includes(b) || r.cliente.toLowerCase().includes(b) || (r.pedido ?? "").toLowerCase().includes(b),
    );
  }
  return rows;
});

/** Uma lista completa (cabeçalho + itens). */
export const getLista = cache(async (id: string): Promise<ListaCompleta | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const [headRes, itensRes, clients] = await Promise.all([
    supabase
      .from("production_lists")
      .select("id, codigo, data_producao, data_entrega, client_id, cliente_nome, pedido, prioridade, status, observacao")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("production_list_items")
      .select("id, linha, caminhao, cor, movel, quantidade, ordem")
      .eq("list_id", id)
      .order("ordem"),
    supabase.from("clients").select("id, nome"),
  ]);

  const l = headRes.data;
  if (!l) return null;
  const clientNome = new Map((clients.data ?? []).map((c) => [c.id, c.nome]));
  const cliente = l.client_id ? (clientNome.get(l.client_id) ?? "—") : l.cliente_nome || "—";

  return {
    id: l.id,
    codigo: l.codigo,
    dataProducao: l.data_producao,
    dataEntrega: l.data_entrega,
    clientId: l.client_id,
    clienteNome: l.cliente_nome,
    pedido: l.pedido,
    prioridade: l.prioridade,
    status: l.status,
    observacao: l.observacao,
    cliente,
    itens: (itensRes.data ?? []).map((i) => ({
      id: i.id,
      linha: i.linha,
      caminhao: i.caminhao,
      cor: i.cor,
      movel: i.movel,
      quantidade: i.quantidade,
      ordem: i.ordem,
    })),
  };
});

/** Móveis já usados — para autocompletar. */
export const getMovelSuggestions = cache(async (): Promise<string[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("production_list_items").select("movel").limit(3000);
  return [...new Set((data ?? []).map((r) => r.movel))].sort((a, b) => a.localeCompare(b));
});

/** Clientes ativos para o seletor. */
export const getClientesOptions = cache(async (): Promise<{ id: string; nome: string }[]> => {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id, nome").eq("ativo", true).order("nome");
  return data ?? [];
});
