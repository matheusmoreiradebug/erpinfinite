import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ListasView } from "@/components/logistica/listas-view";
import { getListas } from "@/lib/data/listas";

export default async function LogisticaPage() {
  const listas = await getListas();

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Listas de produção" subtitle="Crie, edite e imprima as listas diárias para os setores.">
        <Badge variant="brand">
          <ClipboardList className="size-3.5" />
          {listas.length} listas
        </Badge>
      </PageHeader>

      <ListasView listas={listas} />
    </div>
  );
}
