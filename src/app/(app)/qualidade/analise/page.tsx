import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { AnalysisQueue } from "@/components/qualidade/analysis-queue";
import { getReturnsList, signPhotos, getQualityCatalogs } from "@/lib/data/quality";

export default async function AnalisePage() {
  const [pendentes, catalogs] = await Promise.all([
    getReturnsList({ status: ["registrado", "em_analise"] }),
    getQualityCatalogs(),
  ]);

  const allPaths = pendentes.flatMap((r) => r.fotosPaths);
  const photoUrls = await signPhotos(allPaths);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Análise de retornos"
        subtitle="Classifique cada devolução e, se houver, abra o retrabalho."
      >
        <Badge variant={pendentes.length ? "warning" : "success"}>
          <ClipboardCheck className="size-3.5" />
          {pendentes.length} na fila
        </Badge>
      </PageHeader>

      <AnalysisQueue rows={pendentes} photoUrls={photoUrls} catalogs={catalogs} />
    </div>
  );
}
