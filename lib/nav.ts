import {
  BookOpen,
  Brain,
  CalendarDays,
  History,
  LayoutDashboard,
  PersonStanding,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundSearch,
} from "lucide-react";

export const appNavItems = [
  { href: "/", label: "总控台", icon: LayoutDashboard },
  { href: "/roadmap", label: "路线图", icon: CalendarDays },
  { href: "/today", label: "今日执行", icon: Sparkles },
  { href: "/rituals", label: "三段提醒", icon: ShieldCheck },
  { href: "/appearance", label: "外表系统", icon: PersonStanding },
  { href: "/behavior", label: "行为系统", icon: Brain },
  { href: "/social", label: "社交系统", icon: UserRoundSearch },
  { href: "/inner", label: "内在系统", icon: BookOpen },
  { href: "/learning", label: "学习系统", icon: BookOpen },
  { href: "/stocks", label: "股票账本", icon: TrendingUp },
  { href: "/history", label: "历史复盘", icon: History },
] as const;
