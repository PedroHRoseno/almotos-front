"use client";

import { useState, useEffect } from "react";
import { Bike, TrendingUp, Users, DollarSign, Repeat, Info, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { useDashboard } from "@/contexts/DashboardContext";
import type { Dashboard } from "@/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useDashboard();

  useEffect(() => {
    setLoading(true);
    api.reports
      .dashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const stats = [
    {
      title: "Motos em Estoque",
      value: loading ? "..." : String(dashboard?.quantidadeMotosEstoque || 0),
      description: "Veículos disponíveis para venda",
      icon: Bike,
      valueColor: "",
    },
    {
      title: "Total de Vendas",
      value: loading ? "..." : formatCurrency(dashboard?.totalVendas || 0),
      description: "Soma de todas as vendas ativas",
      tooltip: "Apenas transações com status ACTIVE são consideradas. Vendas canceladas não aparecem neste total.",
      icon: DollarSign,
      valueColor: "",
    },
    {
      title: "Total de Compras",
      value: loading ? "..." : formatCurrency(dashboard?.totalCompras || 0),
      description: "Soma de todas as compras ativas",
      tooltip: "Apenas transações com status ACTIVE são consideradas. Compras canceladas não aparecem neste total.",
      icon: Users,
      valueColor: "",
    },
    {
      title: "Total de Trocas",
      value: loading ? "..." : (dashboard?.totalTrocas !== undefined && dashboard.totalTrocas < 0 ? "-" : "") + formatCurrency(Math.abs(dashboard?.totalTrocas || 0)),
      description: "Soma das diferenças de valor das trocas ativas",
      tooltip: "Apenas transações com status ACTIVE são consideradas. Trocas canceladas não aparecem neste total.",
      icon: Repeat,
      valueColor: dashboard && dashboard.totalTrocas < 0 ? "text-red-600 dark:text-red-400" : dashboard && dashboard.totalTrocas > 0 ? "text-green-600 dark:text-green-400" : "",
    },
    {
      title: "Custos Adicionais",
      value: loading ? "..." : formatCurrency(dashboard?.totalCustos || 0),
      description: "Soma de todos os custos adicionais (manutenção, documentação, etc.)",
      tooltip: "Total de custos adicionais registrados para todos os veículos. Esses custos são subtraídos do saldo líquido.",
      icon: Wrench,
      valueColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Despesas Operacionais",
      value: loading ? "..." : formatCurrency(dashboard?.despesasOperacionais || 0),
      description: "Operacional, Administrativo, Marketing, Infraestrutura",
      tooltip: "Soma das despesas operacionais da loja (Operacional, Administrativo, Marketing e Infraestrutura). Essas despesas são subtraídas do lucro bruto.",
      icon: Users,
      valueColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "Lucro Bruto",
      value: loading ? "..." : formatCurrency(dashboard?.lucroBruto || 0),
      description: "Vendas - Compras + Trocas - Custos",
      tooltip: "Cálculo: (Vendas Ativas + Diferença Trocas Ativas) - Compras Ativas - Custos Adicionais de Veículos.",
      icon: TrendingUp,
      valueColor: dashboard && dashboard.lucroBruto < 0 ? "text-red-600 dark:text-red-400" : dashboard && dashboard.lucroBruto > 0 ? "text-green-600 dark:text-green-400" : "",
    },
    {
      title: "Lucro Líquido",
      value: loading ? "..." : formatCurrency(dashboard?.lucroLiquido || 0),
      description: "Lucro Bruto - Despesas Operacionais",
      tooltip: "Cálculo: Lucro Bruto - Despesas Operacionais (Operacional, Administrativo, Marketing, Infraestrutura). Este é o lucro real da loja.",
      icon: TrendingUp,
      valueColor: dashboard && dashboard.lucroLiquido < 0 ? "text-red-600 dark:text-red-400" : dashboard && dashboard.lucroLiquido > 0 ? "text-green-600 dark:text-green-400" : "",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Bem-vindo ao sistema de gerenciamento de motos AlMotos.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate min-w-0">{stat.title}</CardTitle>
              <div className="flex items-center gap-1 shrink-0">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                {stat.tooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">{stat.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className={`min-w-0 break-words text-base sm:text-lg md:text-xl xl:text-2xl font-bold ${stat.valueColor || ""}`} title={typeof stat.value === "string" ? stat.value : undefined}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Lucro Bruto vs Despesas Operacionais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          ) : dashboard ? (
            <div className="space-y-4 min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2">
                    <span className="text-sm font-medium">Lucro Bruto</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400 min-w-0 break-all">
                      {formatCurrency(dashboard.lucroBruto)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-green-600 dark:bg-green-400 h-4 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, (dashboard.lucroBruto / (Math.abs(dashboard.lucroBruto) + Math.abs(dashboard.despesasOperacionais) || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2">
                    <span className="text-sm font-medium">Despesas Operacionais</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 min-w-0 break-all">
                      {formatCurrency(dashboard.despesasOperacionais)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-red-600 dark:bg-red-400 h-4 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, (dashboard.despesasOperacionais / (Math.abs(dashboard.lucroBruto) + Math.abs(dashboard.despesasOperacionais) || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="text-sm font-medium">Lucro Líquido</span>
                <span
                  className={`text-base sm:text-lg font-bold min-w-0 break-all ${
                    dashboard.lucroLiquido >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(dashboard.lucroLiquido)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Erro ao carregar dados do dashboard.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visão geral</CardTitle>
          <p className="text-sm text-muted-foreground">
            Utilize o menu lateral para navegar entre as seções do sistema:
            Motos, Clientes, Vendas, Fluxo de Caixa, Relatórios e Configurações.
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
