"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SaveReturnResult = { ok: boolean; error?: string; id?: string };

/** Resolve um catálogo: usa o id existente ou cria a partir do nome novo. */
async function resolveCatalog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "trucks" | "clients" | "products",
  orgId: string,
  id: string,
  novoNome: string,
): Promise<string | null> {
  if (id) return id;
  const nome = novoNome.trim();
  if (!nome) return null;

  if (table === "trucks") {
    const { data } = await supabase
      .from("trucks")
      .insert({ org_id: orgId, identificador: nome })
      .select("id")
      .single();
    return data?.id ?? null;
  }
  if (table === "clients") {
    const { data } = await supabase
      .from("clients")
      .insert({ org_id: orgId, nome })
      .select("id")
      .single();
    return data?.id ?? null;
  }
  const { data } = await supabase
    .from("products")
    .insert({ org_id: orgId, nome })
    .select("id")
    .single();
  return data?.id ?? null;
}

export async function createReturn(formData: FormData): Promise<SaveReturnResult> {
  const s = (k: string) => (formData.get(k)?.toString() ?? "").trim();

  const quantidade = Number(s("quantidade"));
  if (!s("data_retorno")) return { ok: false, error: "Informe a data do retorno." };
  if (!quantidade || quantidade <= 0) return { ok: false, error: "Quantidade inválida." };

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

  // catálogos (existentes ou criados na hora)
  const truckId = await resolveCatalog(supabase, "trucks", orgId, s("truck_id"), s("truck_novo"));
  const clientId = await resolveCatalog(supabase, "clients", orgId, s("client_id"), s("client_novo"));
  const productId = await resolveCatalog(supabase, "products", orgId, s("product_id"), s("product_novo"));

  // custo para "valor perdido"
  let valorPerdido: number | null = null;
  if (productId) {
    const { data: prod } = await supabase
      .from("products")
      .select("custo_unitario")
      .eq("id", productId)
      .single();
    if (prod?.custo_unitario) valorPerdido = Number(prod.custo_unitario) * quantidade;
  }

  const { data: inserted, error } = await supabase
    .from("quality_returns")
    .insert({
      org_id: orgId,
      pedido: s("pedido") || null,
      data_retorno: s("data_retorno"),
      hora_retorno: s("hora_retorno") || null,
      truck_id: truckId,
      client_id: clientId,
      setor_origem_id: s("setor_origem_id") || null,
      funcionario_id: s("funcionario_id") || null,
      product_id: productId,
      quantidade_retornada: quantidade,
      motivo_inicial: s("motivo_inicial") || null,
      observacao: s("observacao") || null,
      valor_perdido: valorPerdido,
      status: "registrado",
      registrado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) return { ok: false, error: error?.message ?? "Falha ao registrar." };
  const returnId = inserted.id;

  // fotos → Storage (via service role, evita fricção de RLS no Storage)
  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  if (fotos.length) {
    const admin = createAdminClient();
    let i = 0;
    for (const file of fotos) {
      i++;
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${orgId}/${returnId}/${i}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from("avarias")
        .upload(path, buffer, { contentType: file.type, upsert: true });
      if (!upErr) {
        await supabase.from("return_photos").insert({
          org_id: orgId,
          return_id: returnId,
          storage_path: path,
        });
      }
    }
  }

  revalidatePath("/qualidade");
  return { ok: true, id: returnId };
}
