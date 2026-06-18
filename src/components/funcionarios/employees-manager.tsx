"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Search, Pencil, Power, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, Field, inputClass } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { EmployeeDTO, SectorDTO } from "@/lib/data/queries";
import {
  createEmployee,
  updateEmployee,
  setEmployeeActive,
} from "@/app/(app)/funcionarios/actions";

function initials(nome: string) {
  return (
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function EmployeesManager({
  employees,
  sectors,
}: {
  employees: EmployeeDTO[];
  sectors: SectorDTO[];
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDTO | null>(null);
  const [nome, setNome] = useState("");
  const [setorId, setSetorId] = useState("");
  const [adm, setAdm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const sectorName = (id: string | null) => sectors.find((s) => s.id === id)?.nome ?? "—";

  const filtrados = useMemo(
    () => employees.filter((e) => e.nome.toLowerCase().includes(busca.toLowerCase())),
    [employees, busca],
  );

  const openNew = () => {
    setEditing(null);
    setNome("");
    setSetorId(sectors[0]?.id ?? "");
    setAdm("");
    setError(null);
    setOpen(true);
  };

  const openEdit = (e: EmployeeDTO) => {
    setEditing(e);
    setNome(e.nome);
    setSetorId(e.setorId ?? "");
    setAdm(e.dataAdmissao ?? "");
    setError(null);
    setOpen(true);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const input = { nome, setorId: setorId || null, dataAdmissao: adm || null };
      const res = editing
        ? await updateEmployee(editing.id, input)
        : await createEmployee(input);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao salvar.");
      }
    });
  };

  const toggleActive = (e: EmployeeDTO) => {
    setTogglingId(e.id);
    startTransition(async () => {
      await setEmployeeActive(e.id, !e.ativo);
      router.refresh();
      setTogglingId(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar funcionário…"
            className="h-10 w-full rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Button size="sm" onClick={openNew}>
          <UserPlus className="size-4" />
          Novo funcionário
        </Button>
      </div>

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
              {filtrados.map((e) => (
                <tr
                  key={e.id}
                  className={cn(
                    "border-b border-line/60 transition-colors last:border-0 hover:bg-elevated/50",
                    !e.ativo && "opacity-55",
                  )}
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
                    {e.ativo ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                        <span className="size-1.5 rounded-full bg-success" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle">
                        <span className="size-1.5 rounded-full bg-fg-subtle" />
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(e)}
                        disabled={pending && togglingId === e.id}
                        className={e.ativo ? "hover:text-danger" : "hover:text-success"}
                      >
                        {pending && togglingId === e.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Power className="size-3.5" />
                        )}
                        {e.ativo ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-fg-muted">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar funcionário" : "Novo funcionário"}
        description={editing ? editing.nome : "Cadastre um funcionário na fábrica."}
      >
        <div className="space-y-3">
          <Field label="Nome">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              autoFocus
              className={inputClass}
            />
          </Field>
          <Field label="Setor">
            <select value={setorId} onChange={(e) => setSetorId(e.target.value)} className={inputClass}>
              <option value="">Sem setor</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Data de admissão" hint="Opcional">
            <input
              type="date"
              value={adm}
              onChange={(e) => setAdm(e.target.value)}
              className={inputClass}
            />
          </Field>

          {error && (
            <p className="rounded-xl border border-danger/25 bg-danger/[0.07] px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={submit} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
