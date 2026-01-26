"use client";

import { useState, useEffect } from "react";
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { FinancialReport } from "@/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function RelatoriosPage() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = () => {
    setLoading(true);
    api.reports
      .financial(startDate || undefined, endDate || undefined)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Visualize relatórios e indicadores do negócio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório Financeiro
          </CardTitle>
          <CardDescription>
            Período padrão: últimos 30 dias. Personalize as datas abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="date"
              placeholder="Data inicial"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:max-w-xs text-sm md:text-base"
            />
            <Input
              type="date"
              placeholder="Data final"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:max-w-xs text-sm md:text-base"
            />
            <Button type="submit" className="w-full sm:w-auto">Filtrar</Button>
            <Button type="button" variant="outline" onClick={() => {
              setStartDate("");
              setEndDate("");
              fetchReport();
            }} className="w-full sm:w-auto">
              Limpar
            </Button>
          </form>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando relatório...</p>
          ) : report ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(report.totalVendas)}</div>
                  <p className="text-xs text-muted-foreground">
                    Período: {report.startDate} a {report.endDate}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(report.totalCompras)}</div>
                  <p className="text-xs text-muted-foreground">
                    Período: {report.startDate} a {report.endDate}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Trocas</CardTitle>
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${report.totalTrocas >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {report.totalTrocas >= 0 ? "+" : ""}{formatCurrency(report.totalTrocas)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Soma das diferenças de valor
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Geral</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${report.saldoGeral >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCurrency(report.saldoGeral)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vendas - Compras + Trocas
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Erro ao carregar relatório.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
