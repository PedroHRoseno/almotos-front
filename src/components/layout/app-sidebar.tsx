"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bike,
  Users,
  ShoppingCart,
  ShoppingBag,
  Repeat,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-provider";
import { useState, useEffect } from "react";

const menuItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Veículos", href: "/motos", icon: Bike },
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Compras", href: "/compras", icon: ShoppingBag },
  { title: "Vendas", href: "/vendas", icon: ShoppingCart },
  { title: "Trocas", href: "/trocas", icon: Repeat },
  { title: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fechar sidebar mobile ao mudar de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-64",
          "max-md:translate-x-[-100%]",
          mobileOpen && "max-md:translate-x-0"
        )}
      >
      {/* Header */}
      <div
        className={cn(
          "flex border-b border-sidebar-border px-4",
          collapsed ? "h-16 flex-col items-center justify-center gap-0.5 py-2" : "h-16 flex-row items-center justify-between"
        )}
      >
        {!collapsed ? (
          <Link href="/" className="flex shrink-0 items-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="AlMotos"
              width={140}
              height={40}
              className="h-10 w-auto object-contain object-left"
              priority
            />
          </Link>
        ) : (
          <Link href="/" className="flex shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="AlMotos"
              width={48}
              height={24}
              className="h-6 w-auto max-w-[48px] object-contain"
              priority
            />
          </Link>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground max-md:hidden",
              collapsed && "h-8 w-8"
            )}
            onClick={toggle}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/80">
            Sistema de Gestão de Motos v1.0
          </p>
        </div>
      )}
    </aside>
    </>
  );
}
