"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, ChevronLeft, ChevronRight, Loader2, Search, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import type { SaleResponse } from "@/types";
import { FormVenda } from "@/components/forms/form-venda";
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

export default function VendasPage() {
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { refreshDashboard } = useDashboard();

  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset para primeira página ao buscar
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSales = useCallback(() => {
    setLoading(true);
    const search = debouncedSearchTerm.trim() || undefined;
    api.sales
      .listar(page, pageSize, search)
      .then((response) => {
        setSales(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      })
      .catch(() => {
        setSales([]);
        setTotalElements(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setPage(0);
  };

  const handleVendaSuccess = () => {
    setModalOpen(false);
    fetchSales();
    refreshDashboard();
  };

  const handleDeleteClick = (sale: SaleResponse) => {
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete?.id) return;

    setDeleting(true);
    try {
      await api.sales.deletar(saleToDelete.id);
      toast.success("Venda cancelada com sucesso. O veículo foi revertido para disponível.");
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
      fetchSales();
      refreshDashboard();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao excluir venda. Tente novamente."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie as vendas de veículos realizadas.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista de Vendas
          </CardTitle>
          <CardDescription>
            {totalElements} {totalElements === 1 ? "venda registrada" : "vendas registradas"}
            {debouncedSearchTerm && (
              <span className="ml-2">
                • Buscando por: <strong>&quot;{debouncedSearchTerm}&quot;</strong>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por placa, CPF ou nome do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Limpar busca"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sales.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {debouncedSearchTerm
                  ? "Nenhuma venda encontrada com os critérios de busca."
                  : "Nenhuma venda registrada ainda."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Data</TableHead>
                      <TableHead className="min-w-[180px]">Veículo</TableHead>
                      <TableHead className="min-w-[180px]">Cliente</TableHead>
                      <TableHead className="text-right min-w-[120px]">Valor</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-muted/50">
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(sale.saleDate)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm md:text-base">
                              {sale.vehicleBrand} {sale.vehicleModel}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground font-mono">
                              {sale.vehicleLicensePlate}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm md:text-base">{sale.partnerName}</div>
                            <div className="text-xs md:text-sm text-muted-foreground font-mono">
                              {formatCpf(sale.partnerCpf)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm md:text-base">
                          {formatCurrency(sale.salePrice)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(sale)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Excluir venda"
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
                      Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalElements)} de {totalElements} vendas
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
            <DialogTitle>Registrar Nova Venda</DialogTitle>
            <DialogDescription>
              Selecione o veículo disponível, escolha o cliente/parceiro (ou cadastre um novo) e informe o valor da venda.
            </DialogDescription>
          </DialogHeader>
          <FormVenda onSuccess={handleVendaSuccess} insideModal />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta venda? A venda será marcada como CANCELADA e o veículo será revertido para DISPONÍVEL no estoque. Transações canceladas não aparecem nos cálculos financeiros.
              {saleToDelete && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <div><strong>Veículo:</strong> {saleToDelete.vehicleBrand} {saleToDelete.vehicleModel} - {saleToDelete.vehicleLicensePlate}</div>
                  <div><strong>Cliente:</strong> {saleToDelete.partnerName}</div>
                  <div><strong>Valor:</strong> {formatCurrency(saleToDelete.salePrice)}</div>
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
