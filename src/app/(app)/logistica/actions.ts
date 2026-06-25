"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListStatus, ListPriority } from "@/lib/supabase/types";

export type ActionResult = { ok: boolean; error?: string; id?: string };

export type ListaHeaderInput = {
  dataProducao: string;
  dataEntrega: string | null;
  clientId: string | null;
  clienteNome: string | null;
  pedido: string | null;
  prioridade: ListPriority;
  status: ListStatus;
  observacao: string | null;
};
export type ListaItemInput = {
  linha: string;
  caminhao: number | null;
  cor: "branco" | "preto";
  movel: string;
  quantidade: number;
};

async function getOrgId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  return data?.org_id ?? null;
}

/** Resolve cliente: usa id existente, ou cria a partir do nome digitado. */
async function resolveCliente(
  supabase: SupabaseClient,
  orgId: string,
  clientId: string | null,
  nome: string | null,
): Promise<{ clientId: string | null; clienteNome: string | null }> {
  if (clientId) return { clientId, clienteNome: null };
  const n = (nome ?? "").trim();
  if (!n) return { clientId: null, clienteNome: null };
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("org_id", orgId)
    .ilike("nome", n)
    .limit(1)
    .maybeSingle();
  if (existing) return { clientId: existing.id, clienteNome: null };
  const { data: created } = await supabase
    .from("clients")
    .insert({ org_id: orgId, nome: n })
    .select("id")
    .single();
  return created ? { clientId: created.id, clienteNome: null } : { clientId: null, clienteNome: n };
}

/** Cria uma lista vazia (rascunho) e devolve o id para abrir no editor. */
export async function criarLista(): Promise<ActionResult> {
  const supabase = await createClient();
  const orgId = await getOrgId(supabase);
  if (!orgId) return { ok: false, error: "Sessão expirada." };

  const { data: codigo, error: codErr } = await supabase.rpc(
    "next_list_codigo" as never,
    { p_org: orgId } as never,
  );
  if (codErr || !codigo) return { ok: false, error: codErr?.message ?? "Falha ao gerar código." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hoje = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("production_lists")
    .insert({
      org_id: orgId,
      codigo: codigo as unknown as string,
      data_producao: hoje,
      status: "rascunho",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Falha ao criar lista." };
  revalidatePath("/logistica");
  return { ok: true, id: data.id };
}

/** Salva cabeçalho + substitui os itens. */
export async function salvarLista(
  id: string,
  header: ListaHeaderInput,
  itens: ListaItemInput[],
): Promise<ActionResult> {
  if (!header.dataProducao) return { ok: false, error: "Informe a data de produção." };
  const supabase = await createClient();
  const orgId = await getOrgId(supabase);
  if (!orgId) return { ok: false, error: "Sessão expirada." };

  const { clientId, clienteNome } = await resolveCliente(supabase, orgId, header.clientId, header.clienteNome);

  const upd = await supabase
    .from("production_lists")
    .update({
      data_producao: header.dataProducao,
      data_entrega: header.dataEntrega,
      client_id: clientId,
      cliente_nome: clienteNome,
      pedido: header.pedido,
      prioridade: header.prioridade,
      status: header.status,
      observacao: header.observacao,
    })
    .eq("id", id);
  if (upd.error) return { ok: false, error: upd.error.message };

  await supabase.from("production_list_items").delete().eq("list_id", id);
  const validos = itens.filter((i) => i.movel.trim() && i.quantidade > 0);
  if (validos.length) {
    const { error } = await supabase.from("production_list_items").insert(
      validos.map((i, idx) => ({
        org_id: orgId,
        list_id: id,
        linha: i.linha,
        caminhao: i.caminhao,
        cor: i.cor,
        movel: i.movel.trim(),
        quantidade: i.quantidade,
        ordem: idx,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/logistica");
  revalidatePath(`/logistica/${id}`);
  return { ok: true, id };
}

/** Duplica uma lista (novo código, mesmas datas de hoje, copia os itens). */
export async function duplicarLista(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const orgId = await getOrgId(supabase);
  if (!orgId) return { ok: false, error: "Sessão expirada." };

  const { data: src } = await supabase
    .from("production_lists")
    .select("client_id, cliente_nome, pedido, prioridade, observacao")
    .eq("id", id)
    .single();
  if (!src) return { ok: false, error: "Lista não encontrada." };

  const { data: codigo, error: codErr } = await supabase.rpc(
    "next_list_codigo" as never,
    { p_org: orgId } as never,
  );
  if (codErr || !codigo) return { ok: false, error: "Falha ao gerar código." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: nova, error } = await supabase
    .from("production_lists")
    .insert({
      org_id: orgId,
      codigo: codigo as unknown as string,
      data_producao: hoje,
      status: "rascunho",
      client_id: src.client_id,
      cliente_nome: src.cliente_nome,
      pedido: src.pedido,
      prioridade: src.prioridade,
      observacao: src.observacao,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !nova) return { ok: false, error: error?.message ?? "Falha ao duplicar." };

  const { data: itens } = await supabase
    .from("production_list_items")
    .select("linha, caminhao, cor, movel, quantidade, ordem")
    .eq("list_id", id);
  if (itens?.length) {
    await supabase.from("production_list_items").insert(
      itens.map((i) => ({ org_id: orgId, list_id: nova.id, ...i })),
    );
  }

  revalidatePath("/logistica");
  return { ok: true, id: nova.id };
}

export async function mudarStatus(id: string, status: ListStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("production_lists").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/logistica");
  revalidatePath(`/logistica/${id}`);
  return { ok: true, id };
}

export async function excluirLista(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("production_lists").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/logistica");
  return { ok: true };
}
