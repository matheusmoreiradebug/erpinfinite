"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // modo demonstração (sem Supabase configurado): entra direto
    if (!isSupabaseConfigured) {
      router.push("/");
      router.refresh();
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm">
      {/* marca */}
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandLogo size={56} className="glow-brand" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-fg">Infinite Dashboard</h1>
        <p className="mt-1 text-sm text-fg-muted">Acesse o painel de produção</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-fg-subtle">E-mail</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@infinite.com.br"
              className="h-11 w-full rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-fg-subtle">Senha</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </label>

        {error && (
          <p className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} size="lg" className="mt-2 w-full">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Entrando…
            </>
          ) : (
            <>
              Entrar <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      {!isSupabaseConfigured && (
        <p className="mt-4 text-center text-[11px] text-fg-subtle">
          Modo demonstração — configure o Supabase para ativar o login real.
        </p>
      )}
    </div>
  );
}
