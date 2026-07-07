import { FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ImportWizard } from "@/components/logistica/import-wizard";

export default function ImportarListaPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Importar Lista de Produção"
        subtitle="Envie o Excel da logística — o sistema lê, valida e cria a lista sem redigitar."
      >
        <span className="flex items-center gap-2 rounded-full border border-line bg-panel/60 px-3 py-1.5 text-xs text-fg-muted">
          <FileSpreadsheet className="size-3.5" /> .xlsx
        </span>
      </PageHeader>
      <ImportWizard />
    </div>
  );
}
