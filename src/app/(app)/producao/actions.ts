"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type SaveProductionInput = {
  sectorId: string;
  data: string; // yyyy-mm-dd
  rows: { empId?: string; nome: string; qtd: number }[];
};

export type SaveResult = { ok: boolean; mock?: boolean; error?: string; salvos?: number };

export async function saveProduction(input: SaveProductionInput): Promise<SaveResult> {
  const validas = input.rows.filter((r) => r.nome.trim() && r.qtd > 0);
  if (validas.length === 0) return { ok: false, error: "Nenhuma quantidade preenchida." };

  // modo mock — só simula
  if (!isSupabaseConfigured) return { ok: true, mock: true, salvos: validas.length };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { ok: false, error: "Usuário sem organização vinculada." };
  const orgId = profile.org_id;

  // meta individual vigente do setor (snapshot)
  const { data: sector } = await supabase
    .from("sectors")
    .select("meta_diaria_funcionario")
    .eq("id", input.sectorId)
    .single();
  const metaSnapshot = sector?.meta_diaria_funcionario ?? null;

  // resolve o funcionário de cada linha (cria se for um nome novo)
  const entries = [];
  for (const row of validas) {
    let empId = row.empId;

    if (!empId) {
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("org_id", orgId)
        .ilike("nome", row.nome.trim())
        .limit(1)
        .maybeSingle();

      if (existing) {
        empId = existing.id;
      } else {
        const { data: created, error: insErr } = await supabase
          .from("employees")
          .insert({ org_id: orgId, nome: row.nome.trim(), setor_id: input.sectorId })
          .select("id")
          .single();
        if (insErr || !created) return { ok: false, error: "Falha ao cadastrar funcionário." };
        empId = created.id;
      }
    }

    entries.push({
      org_id: orgId,
      funcionario_id: empId,
      setor_id: input.sectorId,
      data: input.data,
      quantidade_produzida: row.qtd,
      meta_individual_snapshot: metaSnapshot,
      created_by: user.id,
    });
  }

  const { error } = await supabase
    .from("production_entries")
    .upsert(entries, { onConflict: "funcionario_id,setor_id,data" });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/producao");
  return { ok: true, salvos: entries.length };
}
