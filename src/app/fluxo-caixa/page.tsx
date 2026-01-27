"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUpDown, Plus, Filter, X, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { FinancialMovement, StoreTransactionCreate, TransactionCategory } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    OPERACIONAL: "Operacional",
    ADMINISTRATIVO: "Administrativo",
    MARKETING: "Marketing",
    INFRAESTRUTURA: "Infraestrutura",
    PESSOAL: "Pessoal",
    SERVICOS_PRESTADOS: "Serviços Prestados",
    OUTROS: "Outros",
  };
  return labels[category] || category;
}

export default function FluxoCaixaPage() {
  const [movements, setMovements] = useState<FinancialMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<"ENTRY" | "EXIT" | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<"thisMonth" | null>(null);
  const [newTransaction, setNewTransaction] = useState<StoreTransactionCreate>({
    description: "",
    value: 0,
    type: "EXIT",
    category: "OUTROS",
  });
  const [addingTransaction, setAddingTransaction] = useState(false);

  const getThisMonthDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const fetchMovements = useCallback(() => {
    setLoading(true);
    const dates = dateFilter === "thisMonth" ? getThisMonthDates() : { startDate: undefined, endDate: undefined };
    
    api.financial
      .movements(page, 20, dates.startDate, dates.endDate, filterType || undefined, filterCategory || undefined)
      .then((data) => {
        setMovements(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar movimentações");
      })
      .finally(() => setLoading(false));
  }, [page, filterType, filterCategory, dateFilter]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleAddTransaction = async () => {
    if (!newTransaction.description || newTransaction.value <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setAddingTransaction(true);
    try {
      await api.storeTransactions.criar(newTransaction);
      toast.success("Transação registrada com sucesso!");
      setModalOpen(false);
      setNewTransaction({
        description: "",
        value: 0,
        type: "EXIT",
        category: "OUTROS",
      });
      fetchMovements();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao registrar transação"
      );
    } finally {
      setAddingTransaction(false);
    }
  };

  const handleFilterThisMonth = () => {
    setDateFilter(dateFilter === "thisMonth" ? null : "thisMonth");
    setPage(0);
  };

  const handleFilterType = (type: "ENTRY" | "EXIT" | null) => {
    setFilterType(type);
    setPage(0);
  };

  const handleFilterCategory = (category: string | null) => {
    setFilterCategory(category);
    setPage(0);
  };

  const clearFilters = () => {
    setFilterType(null);
    setFilterCategory(null);
    setDateFilter(null);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Visualize todas as movimentações financeiras da loja
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateFilter === "thisMonth" ? "default" : "outline"}
              size="sm"
              onClick={handleFilterThisMonth}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Este Mês
            </Button>
            <Button
              variant={filterType === "ENTRY" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterType(filterType === "ENTRY" ? null : "ENTRY")}
            >
              Entradas
            </Button>
            <Button
              variant={filterType === "EXIT" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterType(filterType === "EXIT" ? null : "EXIT")}
            >
              Saídas
            </Button>
            <Select
              value={filterCategory || "all"}
              onValueChange={(value) => handleFilterCategory(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="OPERACIONAL">Operacional</SelectItem>
                <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                <SelectItem value="MARKETING">Marketing</SelectItem>
                <SelectItem value="INFRAESTRUTURA">Infraestrutura</SelectItem>
                <SelectItem value="PESSOAL">Pessoal</SelectItem>
                <SelectItem value="SERVICOS_PRESTADOS">Serviços Prestados</SelectItem>
                <SelectItem value="OUTROS">Outros</SelectItem>
              </SelectContent>
            </Select>
            {(filterType || filterCategory || dateFilter) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
          <CardDescription>
            Total: {totalElements} movimentação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma movimentação encontrada.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium text-sm">Data</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-sm">Descrição</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-sm">Origem</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-sm">Categoria</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-sm">Valor</th>
                      <th className="h-12 px-4 text-center align-middle font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement, index) => (
                      <tr
                        key={`${movement.origin}-${movement.transactionType ?? "item"}-${movement.id}-${index}`}
                        className={`border-b transition-colors ${
                          movement.status === "CANCELLED" ? "opacity-50" : ""
                        }`}
                      >
                        <td className="p-4 align-middle text-sm">
                          {formatDate(movement.date)}
                        </td>
                        <td
                          className={`p-4 align-middle text-sm ${
                            movement.status === "CANCELLED" ? "line-through" : ""
                          }`}
                        >
                          {movement.description}
                          {movement.vehicleLicensePlate && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({movement.vehicleLicensePlate})
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-middle text-sm">
                          <Badge variant={movement.origin === "VEHICLE" ? "default" : "secondary"}>
                            {movement.origin === "VEHICLE" ? "Veículo" : "Loja"}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-sm">
                          {movement.category ? getCategoryLabel(movement.category) : "-"}
                        </td>
                        <td
                          className={`p-4 align-middle text-sm text-right font-medium ${
                            movement.status === "CANCELLED"
                              ? "text-muted-foreground line-through"
                              : movement.type === "ENTRY"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {movement.type === "ENTRY" ? "+" : "-"}
                          {formatCurrency(Math.abs(movement.value))}
                        </td>
                        <td className="p-4 align-middle text-center">
                          <Badge variant={movement.status === "ACTIVE" ? "default" : "secondary"}>
                            {movement.status === "ACTIVE" ? "Ativa" : "Cancelada"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Novo Lançamento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
            <DialogDescription>
              Registre uma nova despesa ou receita da loja
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={newTransaction.type}
                onValueChange={(value: "ENTRY" | "EXIT") =>
                  setNewTransaction({ ...newTransaction, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRY">Entrada (Receita)</SelectItem>
                  <SelectItem value="EXIT">Saída (Despesa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={newTransaction.category}
                onValueChange={(value: TransactionCategory) =>
                  setNewTransaction({ ...newTransaction, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERACIONAL">Operacional</SelectItem>
                  <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="INFRAESTRUTURA">Infraestrutura</SelectItem>
                  <SelectItem value="PESSOAL">Pessoal</SelectItem>
                  <SelectItem value="SERVICOS_PRESTADOS">Serviços Prestados</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Aluguel do mês, Salário funcionários, etc."
                value={newTransaction.description}
                onChange={(e) =>
                  setNewTransaction({ ...newTransaction, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newTransaction.value || ""}
                onChange={(e) =>
                  setNewTransaction({
                    ...newTransaction,
                    value: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data (opcional)</Label>
              <Input
                id="date"
                type="date"
                value={newTransaction.date || ""}
                onChange={(e) =>
                  setNewTransaction({ ...newTransaction, date: e.target.value || undefined })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTransaction} disabled={addingTransaction}>
                {addingTransaction ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
