"use client";

import { useState, useEffect } from "react";
import { Bike, TrendingUp, Users, DollarSign, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
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

  useEffect(() => {
    api.reports
      .dashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, []);

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
      description: "Soma de todas as vendas realizadas",
      icon: DollarSign,
      valueColor: "",
    },
    {
      title: "Total de Compras",
      value: loading ? "..." : formatCurrency(dashboard?.totalCompras || 0),
      description: "Soma de todas as compras realizadas",
      icon: Users,
      valueColor: "",
    },
    {
      title: "Total de Trocas",
      value: loading ? "..." : (dashboard?.totalTrocas !== undefined && dashboard.totalTrocas < 0 ? "-" : "") + formatCurrency(Math.abs(dashboard?.totalTrocas || 0)),
      description: "Soma das diferenças de valor das trocas",
      icon: Repeat,
      valueColor: dashboard && dashboard.totalTrocas < 0 ? "text-red-600 dark:text-red-400" : dashboard && dashboard.totalTrocas > 0 ? "text-green-600 dark:text-green-400" : "",
    },
    {
      title: "Saldo Líquido",
      value: loading ? "..." : formatCurrency(dashboard?.saldoLiquido || 0),
      description: "Vendas - Compras + Trocas",
      icon: TrendingUp,
      valueColor: dashboard && dashboard.saldoLiquido < 0 ? "text-red-600 dark:text-red-400" : dashboard && dashboard.saldoLiquido > 0 ? "text-green-600 dark:text-green-400" : "",
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.valueColor || ""}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão geral</CardTitle>
          <p className="text-sm text-muted-foreground">
            Utilize o menu lateral para navegar entre as seções do sistema:
            Motos, Clientes, Vendas, Relatórios e Configurações.
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
