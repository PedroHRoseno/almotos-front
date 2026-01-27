"use client";

import { useState, useEffect, useCallback } from "react";
import { Repeat, Plus, ChevronLeft, ChevronRight, Loader2, Search, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import type { ExchangeResponse } from "@/types";
import { FormTroca } from "@/components/forms/form-troca";
import { toast } from "sonner";
import { useDashboard } from "@/contexts/DashboardContext";

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
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

function formatCpf(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function TrocasPage() {
  const [exchanges, setExchanges] = useState<ExchangeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exchangeToDelete, setExchangeToDelete] = useState<ExchangeResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { refreshDashboard } = useDashboard();

  const fetchExchanges = useCallback(() => {
    setLoading(true);
    api.exchanges
      .listar(page, pageSize)
      .then((response) => {
        setExchanges(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      })
      .catch(() => {
        setExchanges([]);
        setTotalElements(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setPage(0);
  };

  const handleTrocaSuccess = () => {
    setModalOpen(false);
    fetchExchanges();
    refreshDashboard();
  };

  const handleDeleteClick = (exchange: ExchangeResponse) => {
    setExchangeToDelete(exchange);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exchangeToDelete?.id) return;

    setDeleting(true);
    try {
      await api.exchanges.deletar(exchangeToDelete.id);
      toast.success("Troca cancelada com sucesso. O veículo de saída foi revertido para disponível.");
      setDeleteDialogOpen(false);
      setExchangeToDelete(null);
      fetchExchanges();
      refreshDashboard();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao excluir troca. Tente novamente."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Trocas</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie as trocas de veículos realizadas.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Troca
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Lista de Trocas
          </CardTitle>
          <CardDescription>
            {totalElements} {totalElements === 1 ? "troca registrada" : "trocas registradas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : exchanges.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma troca registrada ainda.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Data</TableHead>
                      <TableHead className="min-w-[180px]">Veículo Entrada</TableHead>
                      <TableHead className="min-w-[180px]">Veículo Saída</TableHead>
                      <TableHead className="min-w-[180px]">Parceiro</TableHead>
                      <TableHead className="text-right min-w-[120px]">Diferença</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exchanges.map((exchange) => (
                      <TableRow key={exchange.id} className="hover:bg-muted/50">
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(exchange.exchangeDate)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm md:text-base">
                              {exchange.vehicleEntradaBrand} {exchange.vehicleEntradaModel}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground font-mono">
                              {exchange.vehicleEntradaLicensePlate}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm md:text-base">
                              {exchange.vehicleSaidaBrand} {exchange.vehicleSaidaModel}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground font-mono">
                              {exchange.vehicleSaidaLicensePlate}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm md:text-base">{exchange.partnerName}</div>
                            <div className="text-xs md:text-sm text-muted-foreground font-mono">
                              {formatCpf(exchange.partnerCpf)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className={`font-medium ${
                              exchange.diferencaValor >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            <div className="text-xs font-normal opacity-90">
                              {exchange.diferencaValor >= 0 ? "Cliente pagou" : "Loja pagou"}
                            </div>
                            <div>
                              {formatCurrency(exchange.diferencaValor)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(exchange)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Excluir troca"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-4 border-t px-2 md:px-4 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm text-muted-foreground">Itens por página:</span>
                      <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="w-[80px] md:w-[100px] text-xs md:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalElements)} de {totalElements} trocas
                    </span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 w-full sm:w-auto justify-center sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(0)}
                      disabled={page <= 0}
                      className="text-xs md:text-sm px-2 md:px-3"
                    >
                      <span className="hidden sm:inline">Primeira</span>
                      <span className="sm:hidden">1ª</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page <= 0}
                      className="text-xs md:text-sm px-2 md:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Anterior</span>
                    </Button>
                    <span className="text-xs md:text-sm text-muted-foreground min-w-[80px] md:min-w-[100px] text-center px-2">
                      {page + 1}/{totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="text-xs md:text-sm px-2 md:px-3"
                    >
                      <span className="hidden sm:inline mr-1">Próxima</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                      className="text-xs md:text-sm px-2 md:px-3"
                    >
                      <span className="hidden sm:inline">Última</span>
                      <span className="sm:hidden">Últ.</span>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nova Troca</DialogTitle>
            <DialogDescription>
              Registre uma troca de veículos. O cliente entrega um veículo como parte do pagamento de outro.
            </DialogDescription>
          </DialogHeader>
          <FormTroca onSuccess={handleTrocaSuccess} insideModal />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta troca? A troca será marcada como CANCELADA e o status do veículo de saída será revertido para DISPONÍVEL. Transações canceladas não aparecem nos cálculos financeiros.
              {exchangeToDelete && (
                <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                  <div><strong>Veículo Entrada:</strong> {exchangeToDelete.vehicleEntradaBrand} {exchangeToDelete.vehicleEntradaModel} - {exchangeToDelete.vehicleEntradaLicensePlate}</div>
                  <div><strong>Veículo Saída:</strong> {exchangeToDelete.vehicleSaidaBrand} {exchangeToDelete.vehicleSaidaModel} - {exchangeToDelete.vehicleSaidaLicensePlate}</div>
                  <div><strong>Parceiro:</strong> {exchangeToDelete.partnerName}</div>
                  <div>
                    <strong>Diferença:</strong>{" "}
                    <span className={exchangeToDelete.diferencaValor >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      {exchangeToDelete.diferencaValor >= 0 ? "Cliente pagou " : "Loja pagou "}
                      {formatCurrency(exchangeToDelete.diferencaValor)}
                    </span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Não Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
