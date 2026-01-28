"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, DollarSign, Calendar, User, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { formatDocument } from "@/lib/masks";
import type { VehicleHistory, VehicleCostItem } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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


export default function VeiculoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placa = params.placa as string;
  
  const [history, setHistory] = useState<VehicleHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [newCost, setNewCost] = useState({ cost: "", description: "", costDate: "" });
  const [addingCost, setAddingCost] = useState(false);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    setError(null);
    api.vehicles
      .historico(placa)
      .then((data) => {
        setHistory(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar histórico do veículo");
      })
      .finally(() => setLoading(false));
  }, [placa]);

  useEffect(() => {
    if (placa) {
      fetchHistory();
    }
  }, [placa, fetchHistory]);

  const handleAddCost = async () => {
    if (!newCost.cost || !newCost.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setAddingCost(true);
    try {
      await api.vehicles.custos.criar(placa, {
        cost: Number(newCost.cost),
        description: newCost.description,
        costDate: newCost.costDate || undefined,
      });
      toast.success("Custo adicionado com sucesso!");
      setCostModalOpen(false);
      setNewCost({ cost: "", description: "", costDate: "" });
      fetchHistory();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao adicionar custo"
      );
    } finally {
      setAddingCost(false);
    }
  };

  const handleDeleteCost = async (id: number) => {
    try {
      await api.vehicles.custos.deletar(placa, id);
      toast.success("Custo removido com sucesso!");
      fetchHistory();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover custo"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/motos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {error || "Veículo não encontrado"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vehicle = history.vehicle;
  const activeSales = history.sales.filter(s => s.status === "ACTIVE");
  const activePurchases = history.purchases.filter(p => p.status === "ACTIVE");
  
  // Calcular lucro: ValorVenda - (ValorCompra + CustosAdicionais)
  const totalPurchasePrice = activePurchases.reduce((sum, p) => sum + p.purchasePrice, 0);
  const totalSalePrice = activeSales.reduce((sum, s) => sum + s.salePrice, 0);
  const totalCosts = history.totalCosts;
  const profit = totalSalePrice - (totalPurchasePrice + totalCosts);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/motos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {vehicle.brand} {vehicle.modelName}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Placa: {vehicle.licensePlate}
          </p>
        </div>
      </div>

      {/* Informações do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Veículo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ano Fabricação</p>
              <p className="text-lg font-semibold">{vehicle.manufactureYear}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ano Modelo</p>
              <p className="text-lg font-semibold">{vehicle.modelYear}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quilometragem</p>
              <p className="text-lg font-semibold">{vehicle.kilometersDriven.toLocaleString("pt-BR")} km</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={vehicle.status === "DISPONIVEL" ? "success" : vehicle.status === "VENDIDO" ? "secondary" : "warning"}>
                {vehicle.status === "DISPONIVEL" ? "Disponível" : vehicle.status === "VENDIDO" ? "Vendido" : "Inativo"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Compras (Ativas)</p>
              <p className="text-xl font-bold">{formatCurrency(totalPurchasePrice)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Custos Adicionais</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(totalCosts)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vendas (Ativas)</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalSalePrice)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
              <p className={`text-xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(profit)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Venda - (Compra + Custos)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custos Adicionais */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Custos Adicionais</CardTitle>
            <CardDescription>
              Manutenção, documentação e outros gastos relacionados ao veículo
            </CardDescription>
          </div>
          <Button onClick={() => setCostModalOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Custo
          </Button>
        </CardHeader>
        <CardContent>
          {history.costs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum custo adicional registrado
            </p>
          ) : (
            <div className="space-y-2">
              {history.costs.map((cost) => (
                <div
                  key={cost.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{cost.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(cost.costDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">{formatCurrency(cost.cost)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCost(cost.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>Timeline completa de compras, vendas e trocas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Compras */}
            {history.purchases.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Compras</h3>
                <div className="space-y-2">
                  {history.purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-start gap-4 p-3 border rounded-lg"
                    >
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            Compra: {formatCurrency(purchase.purchasePrice)}
                          </p>
                          <Badge variant={purchase.status === "ACTIVE" ? "default" : "secondary"}>
                            {purchase.status === "ACTIVE" ? "Ativa" : "Cancelada"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(purchase.purchaseDate.toString())} • {purchase.partnerName} ({formatDocument(purchase.partnerDocument)})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vendas */}
            {history.sales.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Vendas</h3>
                <div className="space-y-2">
                  {history.sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-start gap-4 p-3 border rounded-lg"
                    >
                      <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-green-600">
                            Venda: {formatCurrency(sale.salePrice)}
                          </p>
                          <Badge variant={sale.status === "ACTIVE" ? "default" : "secondary"}>
                            {sale.status === "ACTIVE" ? "Ativa" : "Cancelada"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(sale.saleDate.toString())} • {sale.partnerName} ({formatDocument(sale.partnerDocument)})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trocas */}
            {history.exchanges.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Trocas</h3>
                <div className="space-y-2">
                  {history.exchanges.map((exchange) => (
                    <div
                      key={exchange.id}
                      className="flex items-start gap-4 p-3 border rounded-lg"
                    >
                      <User className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${exchange.diferencaValor >= 0 ? "text-green-600" : "text-red-600"}`}>
                            Diferença: {exchange.diferencaValor >= 0 ? "+" : ""}{formatCurrency(exchange.diferencaValor)}
                          </p>
                          <Badge variant={exchange.status === "ACTIVE" ? "default" : "secondary"}>
                            {exchange.status === "ACTIVE" ? "Ativa" : "Cancelada"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(exchange.exchangeDate.toString())} • {exchange.partnerName} ({formatDocument(exchange.partnerDocument)})
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {exchange.isIncomingVehicle ? "Veículo de entrada" : "Veículo de saída"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.purchases.length === 0 && history.sales.length === 0 && history.exchanges.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma transação registrada para este veículo
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Adicionar Custo */}
      <Dialog open={costModalOpen} onOpenChange={setCostModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Custo Adicional</DialogTitle>
            <DialogDescription>
              Registre um custo relacionado a este veículo (manutenção, documentação, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Valor (R$)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newCost.cost}
                onChange={(e) => setNewCost({ ...newCost, cost: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Troca de óleo, IPVA, etc."
                value={newCost.description}
                onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costDate">Data (opcional)</Label>
              <Input
                id="costDate"
                type="date"
                value={newCost.costDate}
                onChange={(e) => setNewCost({ ...newCost, costDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCostModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCost} disabled={addingCost}>
                {addingCost ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
