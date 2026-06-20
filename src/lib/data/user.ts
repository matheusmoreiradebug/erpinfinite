import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import type { UserRole } from "@/lib/supabase/types";

export type CurrentUser = {
  name: string;
  email: string;
  initials: string;
  role: UserRole;
};

function initialsFrom(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "??"
  );
}

/** Usuário autenticado (ou um padrão de demonstração no modo mock). */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  if (!isSupabaseConfigured) {
    return { name: "Matheus", email: "demo@infinite.com.br", initials: "MM", role: "admin" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { name: "Convidado", email: "", initials: "?", role: "viewer" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const name =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Usuário";
  return {
    name,
    email: user.email ?? "",
    initials: initialsFrom(name),
    role: profile?.role ?? "operador",
  };
});
