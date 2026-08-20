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
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-provider";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { useState, useEffect } from "react";

const menuItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Veículos", href: "/motos", icon: Bike },
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Compras", href: "/compras", icon: ShoppingBag },
  { title: "Vendas", href: "/vendas", icon: ShoppingCart },
  { title: "Trocas", href: "/trocas", icon: Repeat },
  { title: "Fluxo de Caixa", href: "/fluxo-caixa", icon: ArrowUpDown },
  { title: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { title: "Guia", href: "/guia", icon: BookOpen },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const { logout } = useAuth();
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
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-line-soft bg-canvas-soft transition-all duration-300 ease-out-expo",
          collapsed ? "w-[72px]" : "w-64",
          "max-md:translate-x-[-100%]",
          mobileOpen && "max-md:translate-x-0"
        )}
      >
      {/* Header */}
      <div
        className={cn(
          "flex border-b border-line-soft px-4",
          collapsed ? "h-16 flex-col items-center justify-center gap-0.5 py-2" : "h-16 flex-row items-center justify-between"
        )}
      >
        {!collapsed ? (
          <Link href="/" className="flex shrink-0 items-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="AlMotos"
              width={168}
              height={48}
              className="h-12 w-auto object-contain object-left"
              priority
            />
          </Link>
        ) : (
          <Link href="/" className="flex shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="AlMotos"
              width={64}
              height={32}
              className="h-8 w-auto max-w-[64px] object-contain"
              priority
            />
          </Link>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-ink-muted hover:bg-surface-hover hover:text-ink max-md:hidden",
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
            className="text-ink-muted hover:bg-surface-hover hover:text-ink md:hidden"
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
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out-expo",
                    isActive
                      ? "bg-brand/15 text-brand"
                      : "text-ink-muted hover:bg-surface-hover hover:text-ink",
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
      <div className="border-t border-line-soft p-4">
        {!collapsed ? (
          <div className="space-y-2">
            <p className="text-xs text-ink-subtle">
              Sistema de Gestão de Motos v1.0
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-ink-muted hover:bg-surface-hover hover:text-ink"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-ink-muted hover:bg-surface-hover hover:text-ink"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
