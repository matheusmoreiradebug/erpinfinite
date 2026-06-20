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
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.env.NEWUSER_EMAIL;
const password = process.env.NEWUSER_PASS;
const fullName = process.env.NEWUSER_NAME || "Financeiro";
const role = process.env.NEWUSER_ROLE || "admin";

const admin = createClient(url, service, { auth: { persistSession: false } });

// 1) criar (ou recuperar) o usuário no Auth
let userId;
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});

if (createErr) {
  console.log("DEBUG erro:", JSON.stringify({
    message: createErr.message,
    name: createErr.name,
    status: createErr.status,
    code: createErr.code,
  }));
  if (/already|registered|exists|duplicate/i.test(createErr.message || "")) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list.users.find((u) => u.email === email)?.id;
    console.log("• Usuário já existia, reutilizando:", userId);
  } else {
    console.error("✗ Erro ao criar usuário (ver DEBUG acima).");
  }
} else {
  userId = created.user.id;
  console.log("✓ Usuário criado no Auth:", email);
}

// 2) garantir o perfil vinculado à organização (admin)
const { data: org } = await admin
  .from("organizations")
  .select("id")
  .order("created_at")
  .limit(1)
  .single();

const { error: profErr } = await admin
  .from("profiles")
  .upsert(
    { id: userId, org_id: org.id, full_name: fullName, role },
    { onConflict: "id" },
  );
console.log(profErr ? "✗ Perfil: " + profErr.message : `✓ Perfil vinculado (${role}) à org ` + org.id);

// 3) testar o login de verdade com a anon key
const client = createClient(url, anon, { auth: { persistSession: false } });
const { data: signIn, error: signErr } = await client.auth.signInWithPassword({
  email,
  password,
});
console.log(
  signErr ? "✗ Login de teste falhou: " + signErr.message : "✓ Login de teste OK (sessão emitida)",
);
