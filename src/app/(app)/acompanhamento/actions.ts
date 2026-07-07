"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MarkResult = { ok: boolean; error?: string };

/** Marca (upsert) a quantidade concluída de uma etapa para vários itens da lista. */
export async function markStageBulk(
  listId: string,
  setorId: string,
  marks: { itemId: string; quantidade: number }[],
): Promise<MarkResult> {
  if (!setorId) return { ok: false, error: "Selecione a etapa." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return { ok: false, error: "Usuário sem organização." };

  const nowIso = new Date().toISOString();
  const rows = marks
    .filter((m) => m.itemId && m.quantidade >= 0)
    .map((m) => ({
      org_id: profile.org_id,
      list_item_id: m.itemId,
      setor_id: setorId,
      quantidade: Math.max(0, Math.floor(m.quantidade)),
      marcado_por: user.id,
      marcado_em: nowIso,
    }));
  if (!rows.length) return { ok: true };

  const { error } = await supabase
    .from("list_item_stages")
    .upsert(rows, { onConflict: "list_item_id,setor_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/acompanhamento/${listId}`);
  revalidatePath("/acompanhamento");
  revalidatePath("/producao-fluxo");
  return { ok: true };
}
