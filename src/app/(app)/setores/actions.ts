"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult = { ok: boolean; error?: string };

export type SectorInput = {
  nome: string;
  metaIndividual: number;
  metaMensal: number | null;
  cor: string;
};

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

function validar(input: SectorInput): string | null {
  if (!input.nome.trim()) return "Informe o nome do setor.";
  if (!Number.isFinite(input.metaIndividual) || input.metaIndividual < 0)
    return "Meta por funcionário inválida.";
  return null;
}

export async function createSector(input: SectorInput): Promise<ActionResult> {
  const erro = validar(input);
  if (erro) return { ok: false, error: erro };

  const supabase = await createClient();
  const org = await getOrgId(supabase);
  if (!org) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const slug = slugify(input.nome) || `setor-${Date.now()}`;
  const { error } = await supabase.from("sectors").insert({
    org_id: org,
    nome: input.nome.trim(),
    slug,
    meta_diaria_funcionario: Math.round(input.metaIndividual),
    meta_mensal: input.metaMensal,
    cor: input.cor,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Já existe um setor com esse nome." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/setores");
  revalidatePath("/producao");
  return { ok: true };
}

export async function updateSector(id: string, input: SectorInput): Promise<ActionResult> {
  const erro = validar(input);
  if (erro) return { ok: false, error: erro };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sectors")
    .update({
      nome: input.nome.trim(),
      meta_diaria_funcionario: Math.round(input.metaIndividual),
      meta_mensal: input.metaMensal,
      cor: input.cor,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/setores");
  revalidatePath("/producao");
  return { ok: true };
}

export async function setSectorActive(id: string, ativo: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("sectors").update({ ativo }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/setores");
  revalidatePath("/producao");
  return { ok: true };
}
