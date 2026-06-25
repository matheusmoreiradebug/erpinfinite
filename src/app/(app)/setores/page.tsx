import { PageHeader } from "@/components/ui/page-header";
import { PeriodPicker } from "@/components/ui/period-picker";
import { SectorsManager } from "@/components/setores/sectors-manager";
import { getAllSectors, getEmployees, getDashboardData } from "@/lib/data/queries";
import { parseRange, formatRangeLabel } from "@/lib/date-range";

export default async function SetoresPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const range = parseRange(await searchParams);
  const [sectors, employees, dashboard] = await Promise.all([
    getAllSectors(),
    getEmployees(),
    getDashboardData(range),
  ]);

  const headcount: Record<string, number> = {};
  for (const e of employees) {
    if (e.ativo && e.setorId) headcount[e.setorId] = (headcount[e.setorId] ?? 0) + 1;
  }

  const ativos = sectors.filter((s) => s.ativo).length;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Setores" subtitle={`${ativos} ativos · ${formatRangeLabel(range)}`}>
        <PeriodPicker range={range} />
      </PageHeader>
      <SectorsManager
        sectors={sectors}
        sectorProduction={[...dashboard.sectorProduction, ...(dashboard.chapas?.sectorProduction ?? [])]}
        headcount={headcount}
      />
    </div>
  );
}
