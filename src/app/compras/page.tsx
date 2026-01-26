"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Plus, ChevronLeft, ChevronRight, Loader2, Search, X, Trash2 } from "lucide-react";
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
import type { PurchaseResponse } from "@/types";
import { FormCompra } from "@/components/forms/form-compra";

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

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<PurchaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce do termo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset para primeira página ao buscar
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPurchases = () => {
    setLoading(true);
    const search = debouncedSearchTerm.trim() || undefined;
    api.purchases
      .listar(page, pageSize, search)
      .then((response) => {
        setPurchases(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      })
      .catch(() => {
        setPurchases([]);
        setTotalElements(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, pageSize, debouncedSearchTerm]);

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setPage(0);
  };

  const handleCompraSuccess = () => {
    setModalOpen(false);
    fetchPurchases();
  };

  const handleDeleteClick = (purchase: PurchaseResponse) => {
    setPurchaseToDelete(purchase);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!purchaseToDelete?.id) return;

    setDeleting(true);
    try {
      await api.purchases.deletar(purchaseToDelete.id);
      toast.success("Compra excluída com sucesso. O veículo foi removido do estoque.");
      setDeleteDialogOpen(false);
      setPurchaseToDelete(null);
      fetchPurchases();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao excluir compra. Tente novamente."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie as compras de veículos realizadas.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Compra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Lista de Compras
          </CardTitle>
          <CardDescription>
            {totalElements} {totalElements === 1 ? "compra registrada" : "compras registradas"}
            {debouncedSearchTerm && (
              <span className="ml-2">
                • Buscando por: <strong>"{debouncedSearchTerm}"</strong>
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
                placeholder="Buscar por placa, CPF ou nome do fornecedor..."
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
          ) : purchases.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {debouncedSearchTerm
                  ? "Nenhuma compra encontrada com os critérios de busca."
                  : "Nenhuma compra registrada ainda."}
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
                      <TableHead className="min-w-[180px]">Fornecedor</TableHead>
                      <TableHead className="text-right min-w-[120px]">Valor</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id} className="hover:bg-muted/50">
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(purchase.purchaseDate)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm md:text-base">
                              {purchase.vehicleBrand} {purchase.vehicleModel}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground font-mono">
                              {purchase.vehicleLicensePlate}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm md:text-base">{purchase.partnerName}</div>
                            <div className="text-xs md:text-sm text-muted-foreground font-mono">
                              {formatCpf(purchase.partnerCpf)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm md:text-base">
                          {formatCurrency(purchase.purchasePrice)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(purchase)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Excluir compra"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between border-t px-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Itens por página:</span>
                    <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-[100px]">
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
                  <span className="text-sm text-muted-foreground">
                    Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalElements)} de {totalElements} compras
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(0)}
                    disabled={page <= 0}
                  >
                    Primeira
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page <= 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                    Página {page + 1} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Última
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nova Compra</DialogTitle>
            <DialogDescription>
              Registre a compra de um veículo. Você pode selecionar um veículo existente ou cadastrar um novo, assim como selecionar ou cadastrar um fornecedor/parceiro.
            </DialogDescription>
          </DialogHeader>
          <FormCompra onSuccess={handleCompraSuccess} insideModal />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta compra? Isso removerá o veículo do estoque.
              {purchaseToDelete && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <div><strong>Veículo:</strong> {purchaseToDelete.vehicleBrand} {purchaseToDelete.vehicleModel} - {purchaseToDelete.vehicleLicensePlate}</div>
                  <div><strong>Fornecedor:</strong> {purchaseToDelete.partnerName}</div>
                  <div><strong>Valor:</strong> {formatCurrency(purchaseToDelete.purchasePrice)}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
