import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Assistant } from "@/components/ia/assistant";

export default function IaPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Assistente inteligente"
        subtitle="Análises e insights automáticos sobre a produção da fábrica."
      >
        <Badge variant="brand">
          <Sparkles className="size-3.5" />
          Beta
        </Badge>
      </PageHeader>

      <Assistant />
    </div>
  );
}
