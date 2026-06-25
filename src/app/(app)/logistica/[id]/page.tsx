import { notFound } from "next/navigation";
import { ListaEditor } from "@/components/logistica/lista-editor";
import { getLista, getClientesOptions, getMovelSuggestions } from "@/lib/data/listas";

export default async function ListaEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lista, clientes, sugestoes] = await Promise.all([
    getLista(id),
    getClientesOptions(),
    getMovelSuggestions(),
  ]);
  if (!lista) notFound();

  return (
    <div className="animate-fade-up">
      <ListaEditor lista={lista} clientes={clientes} sugestoes={sugestoes} />
    </div>
  );
}
