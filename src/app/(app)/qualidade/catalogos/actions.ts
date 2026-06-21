"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult = { ok: boolean; error?: string };
export type CatalogType = "trucks" | "clients" | "products" | "categories" | "reasons";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getOrgId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  return data?.org_id ?? null;
}

/** Cria ou atualiza um item de catálogo. `data.id` presente = update. */
export async function saveCatalog(
  type: CatalogType,
  data: Record<string, string>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const org = await getOrgId(supabase);
  if (!org) return { ok: false, error: "Sessão expirada." };

  const id = data.id;
  let table: string;
  let payload: Record<string, unknown>;

  switch (type) {
    case "trucks":
      if (!data.identificador?.trim()) return { ok: false, error: "Informe o identificador." };
      table = "trucks";
      payload = { identificador: data.identificador.trim(), placa: data.placa || null, motorista: data.motorista || null };
      break;
    case "clients":
      if (!data.nome?.trim()) return { ok: false, error: "Informe o nome." };
      table = "clients";
      payload = { nome: data.nome.trim(), cidade: data.cidade || null };
      break;
    case "products":
      if (!data.nome?.trim()) return { ok: false, error: "Informe o nome." };
      table = "products";
      payload = {
        nome: data.nome.trim(),
        sku: data.sku || null,
        custo_unitario: data.custo_unitario ? Number(data.custo_unitario) : 0,
      };
      break;
    case "categories":
      if (!data.nome?.trim()) return { ok: false, error: "Informe o nome." };
      table = "return_categories";
      payload = { nome: data.nome.trim(), cor: data.cor || "#2563eb" };
      if (!id) payload.slug = slugify(data.nome) || `cat-${Date.now()}`;
      break;
    case "reasons":
      if (!data.nome?.trim()) return { ok: false, error: "Informe o motivo." };
      if (!data.category_id) return { ok: false, error: "Selecione a categoria." };
      table = "return_reasons";
      payload = { nome: data.nome.trim(), category_id: data.category_id };
      break;
    default:
      return { ok: false, error: "Tipo inválido." };
  }

  // tabela dinâmica: cast para contornar o cliente tipado
  const tbl = supabase.from(table as never);
  const res = id
    ? await tbl.update(payload as never).eq("id", id)
    : await tbl.insert({ org_id: org, ...payload } as never);

  if (res.error) {
    if (res.error.code === "23505") return { ok: false, error: "Já existe um item com esse nome." };
    return { ok: false, error: res.error.message };
  }

  revalidatePath("/qualidade/catalogos");
  revalidatePath("/qualidade/registrar");
  return { ok: true };
}

export async function toggleCatalogActive(
  type: CatalogType,
  id: string,
  ativo: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const table =
    type === "categories" ? "return_categories" : type === "reasons" ? "return_reasons" : type;
  const { error } = await supabase
    .from(table as never)
    .update({ ativo } as never)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/qualidade/catalogos");
  revalidatePath("/qualidade/registrar");
  return { ok: true };
}
