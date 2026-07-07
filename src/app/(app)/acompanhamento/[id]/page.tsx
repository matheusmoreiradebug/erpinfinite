import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FlowMarker } from "@/components/producao/flow-marker";
import { getListaFlow } from "@/lib/data/fluxo";
import { createClient } from "@/lib/supabase/server";

export default async function AcompanhamentoListaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const flow = await getListaFlow(id);
  if (!flow) notFound();

  const supabase = await createClient();
  const { data: lista } = await supabase.from("production_lists").select("codigo").eq("id", id).maybeSingle();

  if (flow.stages.length === 0) {
    return (
      <div className="animate-fade-up space-y-4">
        <PageHeader title="Acompanhamento" subtitle="Fluxo não configurado" />
        <p className="rounded-xl border border-warning/30 bg-warning/[0.07] px-4 py-3 text-sm text-warning">
          Nenhuma etapa de fluxo configurada. Rode a migração db/schema-fluxo-producao.sql e defina a ordem das etapas em Setores.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <Link href="/acompanhamento" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <PageHeader title={`Produção · ${lista?.codigo ?? ""}`} subtitle="Marque quanto cada etapa concluiu. A produção real conta só na etapa final." />
      <FlowMarker listId={id} codigo={lista?.codigo ?? ""} itens={flow.itens} stages={flow.stages} />
    </div>
  );
}
