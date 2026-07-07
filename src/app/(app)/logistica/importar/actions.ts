"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseListaWorkbook, type ParsedImport, type ImportLinha } from "@/lib/import/lista-parser";

export type ImportPreview = ParsedImport & { moveisNaoCadastrados: string[] };
export type PreviewResult = { ok: boolean; error?: string; preview?: ImportPreview };
export type ConfirmResult = { ok: boolean; error?: string; id?: string };

async function getOrgId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  return data?.org_id ?? null;
}

/** Lê o Excel, calcula estatísticas e cruza os móveis com o catálogo. Não grava nada. */
export async function previewListaImport(formData: FormData): Promise<PreviewResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Selecione um arquivo .xlsx." };
  if (!/\.xlsx?$/i.test(file.name)) return { ok: false, error: "Formato inválido — envie um arquivo Excel (.xlsx)." };

  const supabase = await createClient();
  const orgId = await getOrgId(supabase);
  if (!orgId) return { ok: false, error: "Sessão expirada." };

  let parsed: ParsedImport;
  try {
    parsed = await parseListaWorkbook(await file.arrayBuffer());
  } catch (e) {
    return { ok: false, error: "Não consegui ler a planilha: " + (e instanceof Error ? e.message : "arquivo inválido") };
  }

  if (parsed.stats.itens === 0) return { ok: false, error: "Nenhum item encontrado na planilha. Confira se é uma Lista de Produção válida." };

  // móveis não cadastrados no catálogo de produtos
  const { data: prods } = await supabase.from("products").select("nome").eq("org_id", orgId);
  const cadastrados = new Set((prods ?? []).map((p) => p.nome.trim().toUpperCase()));
  const moveisNaoCadastrados = parsed.moveis.filter((m) => !cadastrados.has(m));

  return { ok: true, preview: { ...parsed, moveisNaoCadastrados } };
}

/** Grava a Lista de Produção a partir do resultado do preview (confirmado pelo usuário). */
export async function confirmListaImport(input: {
  dataProducao: string;
  dataEntrega: string | null;
  linhas: ImportLinha[];
}): Promise<ConfirmResult> {
  if (!input.dataProducao) return { ok: false, error: "Informe a data de produção." };
  const supabase = await createClient();
  const orgId = await getOrgId(supabase);
  if (!orgId) return { ok: false, error: "Sessão expirada." };

  // achata os itens de todas as linhas/caminhões
  const itens = input.linhas.flatMap((L) =>
    (L.linha ? L.caminhoes.flatMap((c) => c.itens.map((it) => ({ linha: L.linha as string, caminhao: c.caminhao, cor: it.cor, movel: it.movel.trim(), quantidade: it.quantidade }))) : []),
  ).filter((i) => i.movel && i.quantidade > 0);

  if (!itens.length) return { ok: false, error: "Nenhum item válido para importar." };

  const { data: codigo, error: codErr } = await supabase.rpc("next_list_codigo" as never, { p_org: orgId } as never);
  if (codErr || !codigo) return { ok: false, error: codErr?.message ?? "Falha ao gerar código." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: lista, error: lErr } = await supabase
    .from("production_lists")
    .insert({
      org_id: orgId,
      codigo: codigo as unknown as string,
      data_producao: input.dataProducao,
      data_entrega: input.dataEntrega,
      status: "aguardando_impressao",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (lErr || !lista) return { ok: false, error: lErr?.message ?? "Falha ao criar a lista." };

  const { error: iErr } = await supabase.from("production_list_items").insert(
    itens.map((i, idx) => ({
      org_id: orgId,
      list_id: lista.id,
      linha: i.linha,
      caminhao: i.caminhao,
      cor: i.cor,
      movel: i.movel,
      quantidade: i.quantidade,
      ordem: idx,
    })),
  );
  if (iErr) {
    // desfaz a lista se os itens falharem (evita lista órfã)
    await supabase.from("production_lists").delete().eq("id", lista.id);
    return { ok: false, error: iErr.message };
  }

  revalidatePath("/logistica");
  return { ok: true, id: lista.id };
}
