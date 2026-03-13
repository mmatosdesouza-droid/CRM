'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Calendar, Activity, KanbanSquare, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kanban/contacts", label: "Kanban Contatos", icon: KanbanSquare },
  { href: "/kanban/tasks", label: "Kanban Tarefas", icon: ListTodo },
  { href: "/contacts", label: "Contatos", icon: Users },
  { href: "/deals", label: "Negócios", icon: Briefcase },
  { href: "/activities", label: "Atividades", icon: Activity },
  { href: "/calendar", label: "Calendário", icon: Calendar },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              CRM Kanban
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {navItems?.map?.((item) => {
              const Icon = item?.icon;
              const isActive = pathname === item?.href || pathname?.startsWith?.(item?.href + '/');
              
              return (
                <Link
                  key={item?.href}
                  href={item?.href ?? '#'}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="hidden md:inline">{item?.label}</span>
                </Link>
              );
            }) ?? null}
          </div>
        </div>
      </div>
    </nav>
  );
}
