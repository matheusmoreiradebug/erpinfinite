import { Zap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { QuickLaunch } from "@/components/producao/quick-launch";

export default function ProducaoPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Lançamento de produção"
        subtitle="Digite as quantidades e o sistema calcula meta e aproveitamento na hora."
      >
        <Badge variant="brand">
          <Zap className="size-3.5" />
          Lançamento rápido
        </Badge>
      </PageHeader>

      <QuickLaunch />
    </div>
  );
}
