"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LoadingItem } from "@/lib/data/logistica";

export type SaveLoadingResult = { ok: boolean; error?: string; salvos?: number };

export async function saveLoadingDay(
  data: string,
  linha: string,
  itens: LoadingItem[],
): Promise<SaveLoadingResult> {
  if (!data) return { ok: false, error: "Informe a data." };
  if (!linha) return { ok: false, error: "Selecione a linha." };

  const validos = itens.filter((i) => i.movel.trim() && i.quantidade > 0 && i.caminhao > 0);

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
  if (!profile) return { ok: false, error: "Usuário sem organização." };
  const orgId = profile.org_id;

  // substitui a lista daquele dia + linha (fonte da verdade é o formulário)
  const del = await supabase
    .from("loading_entries")
    .delete()
    .eq("org_id", orgId)
    .eq("data", data)
    .eq("linha", linha);
  if (del.error) return { ok: false, error: del.error.message };

  if (validos.length === 0) {
    revalidatePath("/logistica");
    return { ok: true, salvos: 0 };
  }

  const { error } = await supabase.from("loading_entries").insert(
    validos.map((i) => ({
      org_id: orgId,
      data,
      linha,
      caminhao: i.caminhao,
      cor: i.cor,
      movel: i.movel.trim(),
      quantidade: i.quantidade,
      created_by: user.id,
    })),
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/logistica");
  revalidatePath("/logistica/relatorio");
  return { ok: true, salvos: validos.length };
}
