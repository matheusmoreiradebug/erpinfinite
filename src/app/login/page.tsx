import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* fundo da fábrica */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      />
      {/* véu escuro para legibilidade + leve tom azul da marca */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,9,11,0.88) 0%, rgba(8,9,11,0.66) 50%, rgba(11,26,58,0.6) 100%)",
        }}
      />
      {/* vinheta */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(8,9,11,0.65)_100%)]" />

      {/* cartão de login (vidro fosco) */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-line/70 bg-ink-2/70 p-8 shadow-2xl backdrop-blur-xl">
        <LoginForm />
      </div>
    </div>
  );
}
