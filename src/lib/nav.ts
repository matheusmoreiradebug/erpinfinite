import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Boxes,
  FileBarChart,
  Sparkles,
  ShieldCheck,
  PackageX,
  ClipboardCheck,
  History,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  roles?: UserRole[]; // ausente = todos os cargos; admin sempre vê tudo
  section?: "producao" | "qualidade";
};

export const navItems: NavItem[] = [
  // ---- Produção (Módulo 1) ----
  { label: "Dashboard", href: "/", icon: LayoutDashboard, description: "Visão geral", section: "producao" },
  {
    label: "Produção",
    href: "/producao",
    icon: ClipboardList,
    description: "Lançamento diário",
    roles: ["admin", "qualidade", "gestor", "operador"],
    section: "producao",
  },
  {
    label: "Funcionários",
    href: "/funcionarios",
    icon: Users,
    description: "Cadastro de pessoas",
    roles: ["admin", "qualidade", "gestor"],
    section: "producao",
  },
  {
    label: "Setores",
    href: "/setores",
    icon: Boxes,
    description: "Metas e setores",
    roles: ["admin", "qualidade", "gestor"],
    section: "producao",
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: FileBarChart,
    description: "PDF e exportações",
    roles: ["admin", "qualidade", "gestor"],
    section: "producao",
  },
  {
    label: "Assistente IA",
    href: "/ia",
    icon: Sparkles,
    description: "Insights inteligentes",
    roles: ["admin", "qualidade"],
    section: "producao",
  },

  // ---- Qualidade (Módulo 2) ----
  {
    label: "Qualidade",
    href: "/qualidade",
    icon: ShieldCheck,
    description: "Painel de retornos",
    roles: ["admin", "qualidade"],
    section: "qualidade",
  },
  {
    label: "Registrar retorno",
    href: "/qualidade/registrar",
    icon: PackageX,
    description: "Entrada de avarias",
    roles: ["admin", "qualidade", "almoxarifado"],
    section: "qualidade",
  },
  {
    label: "Análise",
    href: "/qualidade/analise",
    icon: ClipboardCheck,
    description: "Classificar retornos",
    roles: ["admin", "qualidade"],
    section: "qualidade",
  },
  {
    label: "Histórico",
    href: "/qualidade/historico",
    icon: History,
    description: "Todos os retornos",
    roles: ["admin", "qualidade"],
    section: "qualidade",
  },
];

export function visibleNav(role: UserRole): NavItem[] {
  return navItems.filter((i) => !i.roles || role === "admin" || i.roles.includes(role));
}
