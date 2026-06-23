import { PageHeader } from "@/components/ui/page-header";
import { PeriodPicker } from "@/components/ui/period-picker";
import { HistoryFilters } from "@/components/qualidade/history-filters";
import { ReturnsTable } from "@/components/qualidade/returns-table";
import { ScopeToggle } from "@/components/qualidade/scope-toggle";
import {
  getReturnsList, getQualityCatalogs, type ReturnFilters, type ReturnStatus,
} from "@/lib/data/quality";
import { getCurrentUser } from "@/lib/data/user";
import { parseRange, formatRangeLabel } from "@/lib/date-range";

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp);
  const user = await getCurrentUser();

  // almoxarifado vê os "meus" por padrão; gestão vê "todos"
  const escopo: "meus" | "todos" =
    sp.escopo === "todos" || sp.escopo === "meus"
      ? sp.escopo
      : user.role === "almoxarifado"
        ? "meus"
        : "todos";

  const filters: ReturnFilters = {
    range,
    status: sp.status ? [sp.status as ReturnStatus] : undefined,
    setorId: sp.setor,
    funcionarioId: sp.funcionario,
    truckId: sp.caminhao,
    categoryId: sp.categoria,
    registradoPor: escopo === "meus" && user.id ? user.id : undefined,
  };

  const [rows, catalogs] = await Promise.all([getReturnsList(filters), getQualityCatalogs()]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Histórico de retornos"
        subtitle={`${rows.length} registros · ${formatRangeLabel(range)}`}
      >
        <ScopeToggle current={escopo} />
        <PeriodPicker range={range} />
      </PageHeader>

      <HistoryFilters catalogs={catalogs} />

      <ReturnsTable rows={rows} />
    </div>
  );
}
