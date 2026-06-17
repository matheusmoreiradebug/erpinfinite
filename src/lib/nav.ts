import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Boxes,
  FileBarChart,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Visão geral",
  },
  {
    label: "Produção",
    href: "/producao",
    icon: ClipboardList,
    description: "Lançamento diário",
  },
  {
    label: "Funcionários",
    href: "/funcionarios",
    icon: Users,
    description: "Cadastro de pessoas",
  },
  {
    label: "Setores",
    href: "/setores",
    icon: Boxes,
    description: "Metas e setores",
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: FileBarChart,
    description: "PDF e exportações",
  },
  {
    label: "Assistente IA",
    href: "/ia",
    icon: Sparkles,
    description: "Insights inteligentes",
  },
];
