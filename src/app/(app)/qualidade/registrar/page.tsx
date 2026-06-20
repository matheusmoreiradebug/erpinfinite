import { PackageX } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ReturnForm } from "@/components/qualidade/return-form";
import { getQualityCatalogs } from "@/lib/data/quality";

export default async function RegistrarRetornoPage() {
  const catalogs = await getQualityCatalogs();

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Registrar retorno"
        subtitle="Almoxarifado: registre a peça que voltou. A qualidade classifica depois."
      >
        <Badge variant="brand">
          <PackageX className="size-3.5" />
          Entrada de avaria
        </Badge>
      </PageHeader>

      <ReturnForm catalogs={catalogs} />
    </div>
  );
}
