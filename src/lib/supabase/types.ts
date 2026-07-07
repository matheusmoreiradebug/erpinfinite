/**
 * Tipos do banco — espelham db/schema.sql.
 * Quando o projeto estiver no ar, dá para gerar automaticamente com:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 */

export type UserRole =
  | "admin"
  | "gestor"
  | "operador"
  | "viewer"
  | "qualidade"
  | "almoxarifado"
  | "logistica";

export type ListStatus =
  | "rascunho"
  | "aguardando_impressao"
  | "em_producao"
  | "producao_concluida"
  | "expedida"
  | "finalizada";
export type ListPriority = "baixa" | "normal" | "alta" | "urgente";

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; slug: string; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug: string };
        Update: Partial<{ name: string; slug: string }>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          org_id: string;
          full_name: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: { id: string; org_id: string; full_name: string; role?: UserRole };
        Update: Partial<{ full_name: string; role: UserRole }>;
        Relationships: [];
      };
      sectors: {
        Row: {
          id: string;
          org_id: string;
          nome: string;
          slug: string;
          meta_diaria_funcionario: number;
          meta_mensal: number | null;
          cor: string | null;
          ativo: boolean;
          tipo_producao: "peca" | "chapa";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          nome: string;
          slug: string;
          meta_diaria_funcionario?: number;
          meta_mensal?: number | null;
          cor?: string | null;
          ativo?: boolean;
          tipo_producao?: "peca" | "chapa";
        };
        Update: Partial<{
          nome: string;
          slug: string;
          meta_diaria_funcionario: number;
          meta_mensal: number | null;
          cor: string | null;
          ativo: boolean;
          tipo_producao: "peca" | "chapa";
        }>;
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          org_id: string;
          nome: string;
          setor_id: string | null;
          matricula: string | null;
          data_admissao: string | null;
          data_desligamento: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          nome: string;
          setor_id?: string | null;
          matricula?: string | null;
          data_admissao?: string | null;
          ativo?: boolean;
        };
        Update: Partial<{
          nome: string;
          setor_id: string | null;
          matricula: string | null;
          data_admissao: string | null;
          data_desligamento: string | null;
          ativo: boolean;
        }>;
        Relationships: [];
      };
      production_entries: {
        Row: {
          id: string;
          org_id: string;
          funcionario_id: string;
          setor_id: string;
          data: string;
          quantidade_produzida: number;
          meta_individual_snapshot: number | null;
          observacao: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          funcionario_id: string;
          setor_id: string;
          data: string;
          quantidade_produzida: number;
          meta_individual_snapshot?: number | null;
          observacao?: string | null;
          created_by?: string | null;
        };
        Update: Partial<{
          quantidade_produzida: number;
          meta_individual_snapshot: number | null;
          observacao: string | null;
        }>;
        Relationships: [];
      };
      ai_insights: {
        Row: {
          id: string;
          org_id: string;
          escopo: string;
          severidade: "info" | "sucesso" | "alerta" | "critico";
          titulo: string;
          conteudo: string;
          periodo_ini: string | null;
          periodo_fim: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          escopo: string;
          severidade?: "info" | "sucesso" | "alerta" | "critico";
          titulo: string;
          conteudo: string;
          periodo_ini?: string | null;
          periodo_fim?: string | null;
        };
        Update: Partial<{ severidade: string; titulo: string; conteudo: string }>;
        Relationships: [];
      };
      clients: {
        Row: { id: string; org_id: string; nome: string; cidade: string | null; ativo: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; nome: string; cidade?: string | null; ativo?: boolean };
        Update: Partial<{ nome: string; cidade: string | null; ativo: boolean }>;
        Relationships: [];
      };
      trucks: {
        Row: { id: string; org_id: string; identificador: string; placa: string | null; motorista: string | null; ativo: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; identificador: string; placa?: string | null; motorista?: string | null; ativo?: boolean };
        Update: Partial<{ identificador: string; placa: string | null; motorista: string | null; ativo: boolean }>;
        Relationships: [];
      };
      products: {
        Row: { id: string; org_id: string; nome: string; sku: string | null; custo_unitario: number | null; ativo: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; nome: string; sku?: string | null; custo_unitario?: number | null; ativo?: boolean };
        Update: Partial<{ nome: string; sku: string | null; custo_unitario: number | null; ativo: boolean }>;
        Relationships: [];
      };
      return_categories: {
        Row: { id: string; org_id: string; nome: string; slug: string; cor: string | null; ordem: number | null; ativo: boolean; created_at: string };
        Insert: { id?: string; org_id: string; nome: string; slug: string; cor?: string | null; ordem?: number | null; ativo?: boolean };
        Update: Partial<{ nome: string; cor: string | null; ordem: number | null; ativo: boolean }>;
        Relationships: [];
      };
      return_reasons: {
        Row: { id: string; org_id: string; category_id: string; nome: string; ordem: number | null; ativo: boolean; created_at: string };
        Insert: { id?: string; org_id: string; category_id: string; nome: string; ordem?: number | null; ativo?: boolean };
        Update: Partial<{ category_id: string; nome: string; ordem: number | null; ativo: boolean }>;
        Relationships: [];
      };
      deliveries: {
        Row: { id: string; org_id: string; pedido: string | null; data: string; truck_id: string | null; client_id: string | null; quantidade: number | null; created_at: string };
        Insert: { id?: string; org_id: string; pedido?: string | null; data: string; truck_id?: string | null; client_id?: string | null; quantidade?: number | null };
        Update: Partial<{ pedido: string | null; data: string; truck_id: string | null; client_id: string | null; quantidade: number | null }>;
        Relationships: [];
      };
      quality_returns: {
        Row: {
          id: string; org_id: string; pedido: string | null; data_retorno: string; hora_retorno: string | null;
          truck_id: string | null; client_id: string | null; setor_origem_id: string | null; funcionario_id: string | null;
          product_id: string | null; quantidade_retornada: number; motivo_inicial: string | null; reason_id: string | null;
          observacao: string | null; valor_perdido: number | null; status: "registrado" | "em_analise" | "classificado" | "resolvido";
          gravidade: string | null; destino: string | null; responsabilidade: string | null; analise: string | null; acao_preventiva: string | null;
          frete_valor: number | null; frete_cenario: string | null; frete_motorista: string | null;
          registrado_por: string | null; analisado_por: string | null; analisado_em: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; org_id: string; pedido?: string | null; data_retorno: string; hora_retorno?: string | null;
          truck_id?: string | null; client_id?: string | null; setor_origem_id?: string | null; funcionario_id?: string | null;
          product_id?: string | null; quantidade_retornada: number; motivo_inicial?: string | null; reason_id?: string | null;
          observacao?: string | null; valor_perdido?: number | null; status?: "registrado" | "em_analise" | "classificado" | "resolvido";
          frete_valor?: number | null; frete_cenario?: string | null; frete_motorista?: string | null;
          registrado_por?: string | null;
        };
        Update: Partial<{
          reason_id: string | null; observacao: string | null; valor_perdido: number | null;
          gravidade: string | null; destino: string | null; responsabilidade: string | null; analise: string | null; acao_preventiva: string | null;
          frete_valor: number | null; frete_cenario: string | null; frete_motorista: string | null;
          status: "registrado" | "em_analise" | "classificado" | "resolvido"; analisado_por: string | null; analisado_em: string | null;
        }>;
        Relationships: [];
      };
      return_photos: {
        Row: { id: string; org_id: string; return_id: string; storage_path: string; created_at: string };
        Insert: { id?: string; org_id: string; return_id: string; storage_path: string };
        Update: Partial<{ storage_path: string }>;
        Relationships: [];
      };
      rework: {
        Row: {
          id: string; org_id: string; return_id: string; setor_responsavel_id: string | null; funcionario_id: string | null;
          custo_material: number | null; custo_mao_obra: number | null; tempo_minutos: number | null;
          status: "pendente" | "em_andamento" | "concluido"; observacao: string | null; concluido_em: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; org_id: string; return_id: string; setor_responsavel_id?: string | null; funcionario_id?: string | null;
          custo_material?: number | null; custo_mao_obra?: number | null; tempo_minutos?: number | null;
          status?: "pendente" | "em_andamento" | "concluido"; observacao?: string | null;
        };
        Update: Partial<{
          setor_responsavel_id: string | null; funcionario_id: string | null; custo_material: number | null;
          custo_mao_obra: number | null; tempo_minutos: number | null; status: "pendente" | "em_andamento" | "concluido"; observacao: string | null; concluido_em: string | null;
        }>;
        Relationships: [];
      };
      weekly_closings: {
        Row: { id: string; org_id: string; semana_inicio: string; semana_fim: string; resumo: Json; analise_ia: string | null; gerado_em: string };
        Insert: { id?: string; org_id: string; semana_inicio: string; semana_fim: string; resumo: Json; analise_ia?: string | null };
        Update: Partial<{ resumo: Json; analise_ia: string | null }>;
        Relationships: [];
      };
      audit_logs: {
        Row: { id: string; org_id: string; user_id: string | null; acao: string; entidade: string; entidade_id: string | null; dados: Json | null; created_at: string };
        Insert: { id?: string; org_id: string; user_id?: string | null; acao: string; entidade: string; entidade_id?: string | null; dados?: Json | null };
        Update: Partial<{ acao: string }>;
        Relationships: [];
      };
      loading_entries: {
        Row: { id: string; org_id: string; data: string; linha: string; caminhao: number; cor: "branco" | "preto"; movel: string; quantidade: number; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; org_id: string; data: string; linha: string; caminhao: number; cor: "branco" | "preto"; movel: string; quantidade: number; created_by?: string | null };
        Update: Partial<{ data: string; linha: string; caminhao: number; cor: "branco" | "preto"; movel: string; quantidade: number }>;
        Relationships: [];
      };
      production_lists: {
        Row: {
          id: string; org_id: string; codigo: string; data_producao: string; data_entrega: string | null;
          client_id: string | null; cliente_nome: string | null; pedido: string | null;
          prioridade: ListPriority; status: ListStatus; observacao: string | null;
          created_by: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; org_id: string; codigo: string; data_producao: string; data_entrega?: string | null;
          client_id?: string | null; cliente_nome?: string | null; pedido?: string | null;
          prioridade?: ListPriority; status?: ListStatus; observacao?: string | null; created_by?: string | null;
        };
        Update: Partial<{
          data_producao: string; data_entrega: string | null; client_id: string | null; cliente_nome: string | null;
          pedido: string | null; prioridade: ListPriority; status: ListStatus; observacao: string | null;
        }>;
        Relationships: [];
      };
      production_list_items: {
        Row: {
          id: string; org_id: string; list_id: string; linha: string; caminhao: number | null;
          cor: "branco" | "preto"; movel: string; quantidade: number; ordem: number | null; created_at: string;
        };
        Insert: {
          id?: string; org_id: string; list_id: string; linha: string; caminhao?: number | null;
          cor?: "branco" | "preto"; movel: string; quantidade: number; ordem?: number | null;
        };
        Update: Partial<{ linha: string; caminhao: number | null; cor: "branco" | "preto"; movel: string; quantidade: number; ordem: number | null }>;
        Relationships: [];
      };
      list_sequences: {
        Row: { org_id: string; ano: number; ultimo: number };
        Insert: { org_id: string; ano: number; ultimo?: number };
        Update: Partial<{ ultimo: number }>;
        Relationships: [];
      };
    };
    Views: {
      v_producao_setor_dia: {
        Row: {
          org_id: string;
          setor_id: string;
          setor_nome: string;
          data: string;
          funcionarios_no_dia: number;
          producao_total: number;
          meta_equipe_dia: number;
          aproveitamento: number | null;
        };
        Relationships: [];
      };
      v_producao_funcionario_mes: {
        Row: {
          org_id: string;
          funcionario_id: string;
          funcionario_nome: string;
          mes: string;
          dias_produzidos: number;
          producao_mes: number;
          media_diaria: number;
        };
        Relationships: [];
      };
      v_dashboard_kpis: {
        Row: {
          org_id: string;
          data: string;
          producao_dia: number;
          funcionarios_ativos_dia: number;
          setores_ativos_dia: number;
        };
        Relationships: [];
      };
      v_qualidade_por_setor: {
        Row: { org_id: string; setor_id: string; setor_nome: string; producao_total: number; pecas_retornadas: number; taxa_retorno: number | null };
        Relationships: [];
      };
      v_qualidade_por_funcionario: {
        Row: { org_id: string; funcionario_id: string; funcionario_nome: string; producao_total: number; pecas_retornadas: number; taxa_erro: number | null };
        Relationships: [];
      };
      v_qualidade_por_caminhao: {
        Row: { org_id: string; truck_id: string; identificador: string; entregas: number; retornos: number; taxa_problemas: number | null };
        Relationships: [];
      };
      v_qualidade_por_categoria: {
        Row: { org_id: string; categoria_id: string; categoria: string; data_retorno: string; ocorrencias: number; pecas: number };
        Relationships: [];
      };
      v_retrabalho_custo: {
        Row: { org_id: string; mes: string; ordens: number; custo_total: number | null; tempo_total_min: number | null };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: { user_role: UserRole };
    CompositeTypes: Record<string, never>;
  };
};
