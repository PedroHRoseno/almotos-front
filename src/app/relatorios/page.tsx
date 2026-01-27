"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Repeat, Wrench } from "lucide-react";
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

  const fetchReport = useCallback(() => {
    setLoading(true);
    api.reports
      .financial(startDate || undefined, endDate || undefined)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

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
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Card className="min-w-0 overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium truncate min-w-0">Total de Vendas</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="min-w-0">
                  <div className="min-w-0 break-words text-base sm:text-lg md:text-xl xl:text-2xl font-bold" title={formatCurrency(report.totalVendas)}>
                    {formatCurrency(report.totalVendas)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    Período: {report.startDate} a {report.endDate}
                  </p>
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium truncate min-w-0">Total de Compras</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="min-w-0">
                  <div className="min-w-0 break-words text-base sm:text-lg md:text-xl xl:text-2xl font-bold" title={formatCurrency(report.totalCompras)}>
                    {formatCurrency(report.totalCompras)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    Período: {report.startDate} a {report.endDate}
                  </p>
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium truncate min-w-0">Total de Trocas</CardTitle>
                  <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="min-w-0">
                  <div className={`min-w-0 break-words text-base sm:text-lg md:text-xl xl:text-2xl font-bold ${report.totalTrocas >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} title={formatCurrency(report.totalTrocas)}>
                    {report.totalTrocas >= 0 ? "+" : ""}{formatCurrency(report.totalTrocas)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Soma das diferenças de valor
                  </p>
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium truncate min-w-0">Custos Adicionais</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="min-w-0">
                  <div className="min-w-0 break-words text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-orange-600 dark:text-orange-400" title={formatCurrency(report.totalCustos)}>
                    {formatCurrency(report.totalCustos)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manutenção, documentação, etc.
                  </p>
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium truncate min-w-0">Saldo Geral</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="min-w-0">
                  <div className={`min-w-0 break-words text-base sm:text-lg md:text-xl xl:text-2xl font-bold ${report.saldoGeral >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} title={formatCurrency(report.saldoGeral)}>
                    {formatCurrency(report.saldoGeral)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vendas - Compras + Trocas - Custos
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
