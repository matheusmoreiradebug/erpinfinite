import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, service, { auth: { persistSession: false } });

console.log("Contagem real (service_role, ignora RLS):\n");
for (const tbl of [
  "organizations",
  "sectors",
  "employees",
  "production_entries",
  "ai_insights",
  "profiles",
]) {
  const { count, error } = await admin
    .from(tbl)
    .select("*", { count: "exact", head: true });
  console.log(`  ${tbl.padEnd(20)} ${error ? "✗ " + error.message : (count ?? 0) + " linhas"}`);
}

// usuários de auth existentes
const { data: users, error: uErr } = await admin.auth.admin.listUsers();
console.log(
  "\nUsuários no Auth:",
  uErr ? "✗ " + uErr.message : `${users.users.length} (${users.users.map((u) => u.email).join(", ") || "nenhum"})`,
);
