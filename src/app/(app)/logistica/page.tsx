import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LoadingForm } from "@/components/logistica/loading-form";
import { getLoadingDay, getMovelSuggestions, LINHAS, linhaLabel } from "@/lib/data/logistica";
import { todayRange } from "@/lib/date-range";

export default async function ListaProducaoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; linha?: string }>;
}) {
  const sp = await searchParams;
  const data = sp.data || todayRange().from;
  const linha = LINHAS.some((l) => l.key === sp.linha) ? (sp.linha as string) : LINHAS[0].key;

  const [itens, sugestoes] = await Promise.all([
    getLoadingDay(data, linha),
    getMovelSuggestions(),
  ]);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Lista de produção"
        subtitle={`Carregamento por caminhão · ${linhaLabel(linha)}`}
      >
        <Badge variant="brand">
          <ClipboardList className="size-3.5" />
          Preenchimento diário
        </Badge>
      </PageHeader>

      <LoadingForm key={`${data}-${linha}`} data={data} linha={linha} initial={itens} sugestoes={sugestoes} />
    </div>
  );
}
