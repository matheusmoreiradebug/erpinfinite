import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { SUPABASE_URL } from "./config";

/**
 * Cliente com service_role — USO EXCLUSIVO NO SERVIDOR.
 * Ignora RLS. Usado só para operações administrativas pontuais
 * (ex.: upload de fotos no Storage). Nunca importar em client components.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
