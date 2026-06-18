"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult = { ok: boolean; error?: string };

export type EmployeeInput = {
  nome: string;
  setorId: string | null;
  dataAdmissao: string | null;
};

async function getOrgId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  return data?.org_id ?? null;
}

function validar(input: EmployeeInput): string | null {
  if (!input.nome.trim()) return "Informe o nome do funcionário.";
  return null;
}

export async function createEmployee(input: EmployeeInput): Promise<ActionResult> {
  const erro = validar(input);
  if (erro) return { ok: false, error: erro };

  const supabase = await createClient();
  const org = await getOrgId(supabase);
  if (!org) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase.from("employees").insert({
    org_id: org,
    nome: input.nome.trim(),
    setor_id: input.setorId || null,
    data_admissao: input.dataAdmissao || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/funcionarios");
  revalidatePath("/producao");
  return { ok: true };
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<ActionResult> {
  const erro = validar(input);
  if (erro) return { ok: false, error: erro };

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({
      nome: input.nome.trim(),
      setor_id: input.setorId || null,
      data_admissao: input.dataAdmissao || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/funcionarios");
  revalidatePath("/producao");
  return { ok: true };
}

export async function setEmployeeActive(id: string, ativo: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").update({ ativo }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/funcionarios");
  revalidatePath("/producao");
  return { ok: true };
}
