/**
 * Tipos do banco — espelham db/schema.sql.
 * Quando o projeto estiver no ar, dá para gerar automaticamente com:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 */

export type UserRole = "admin" | "gestor" | "operador" | "viewer";

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
        };
        Update: Partial<{
          nome: string;
          slug: string;
          meta_diaria_funcionario: number;
          meta_mensal: number | null;
          cor: string | null;
          ativo: boolean;
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
    };
    Functions: Record<string, never>;
    Enums: { user_role: UserRole };
    CompositeTypes: Record<string, never>;
  };
};
