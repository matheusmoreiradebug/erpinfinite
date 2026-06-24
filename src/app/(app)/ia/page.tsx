import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Assistant } from "@/components/ia/assistant";
import { getDashboardData } from "@/lib/data/queries";
import { monthRange } from "@/lib/date-range";
import { isAiConfigured } from "@/lib/ai";

export default async function IaPage() {
  const d = await getDashboardData(monthRange());
  const insights = d.insights.map((i) => ({
    id: i.id,
    severidade: i.severidade as string,
    titulo: i.titulo,
    texto: i.texto,
  }));

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Assistente inteligente"
        subtitle="Análises automáticas sobre produção e qualidade, com IA."
      >
        <Badge variant="brand">
          <Sparkles className="size-3.5" />
          Claude
        </Badge>
      </PageHeader>

      <Assistant insights={insights} aiOn={isAiConfigured} />
    </div>
  );
}
