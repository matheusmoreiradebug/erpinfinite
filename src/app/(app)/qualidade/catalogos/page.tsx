import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { CatalogsTabs } from "@/components/qualidade/catalogs-tabs";
import { getCatalogsForManage } from "@/lib/data/quality";

export default async function CatalogosPage() {
  const data = await getCatalogsForManage();

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Catálogos"
        subtitle="Gerencie caminhões, clientes, produtos e os motivos de retorno."
      >
        <Badge variant="brand">
          <Boxes className="size-3.5" />
          Cadastros
        </Badge>
      </PageHeader>

      <CatalogsTabs data={data} />
    </div>
  );
}
