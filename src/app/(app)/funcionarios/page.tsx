import { UserPlus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { employees, sectors } from "@/lib/mock-data";

function initials(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function FuncionariosPage() {
  const sectorName = (id: string) => sectors.find((s) => s.id === id)?.nome ?? "—";

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Funcionários"
        subtitle={`${employees.length} funcionários cadastrados`}
      >
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            placeholder="Buscar…"
            className="h-10 w-48 rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Button size="sm">
          <UserPlus className="size-4" />
          Novo funcionário
        </Button>
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-fg-subtle">
                <th className="px-5 py-3.5 font-medium">Funcionário</th>
                <th className="px-5 py-3.5 font-medium">Setor</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-elevated/50"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand/80 to-brand-3/80 text-xs font-semibold text-white">
                        {initials(e.nome)}
                      </span>
                      <span className="font-medium text-fg">{e.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge>{sectorName(e.setorId)}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                      <span className="size-1.5 rounded-full bg-success" />
                      Ativo
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
