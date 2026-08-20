"use client";

import { useState, useEffect, useCallback } from "react";
import { Bike, Plus, Search, ChevronLeft, ChevronRight, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormVeiculo } from "@/components/forms/form-veiculo";
import { FilterChip } from "@/components/ui/filter-chip";
import { api } from "@/lib/api";
import type { Vehicle } from "@/types";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

type StockFilter = "TODOS" | "SIM" | "NAO";
type PublishedFilter = "TODOS" | "PUBLICADOS" | "NAO_PUBLICADOS";

function formatKm(val: number) {
  return new Intl.NumberFormat("pt-BR").format(val) + " km";
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
function isHexColor(s: string | null | undefined): boolean {
  return !!s && HEX_REGEX.test(s);
}

function stockFilterToInStock(filter: StockFilter): boolean | undefined {
  if (filter === "SIM") return true;
  if (filter === "NAO") return false;
  return undefined;
}

function publishedFilterToPublished(filter: PublishedFilter): boolean | undefined {
  if (filter === "PUBLICADOS") return true;
  if (filter === "NAO_PUBLICADOS") return false;
  return undefined;
}

export default function MotosPage() {
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: "create" } | { type: "edit"; vehicle: Vehicle } | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("TODOS");
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>("TODOS");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchVehicles = useCallback(() => {
    setLoading(true);
    const search = debouncedSearchTerm.trim() || undefined;
    api.vehicles
      .listar(page, pageSize, {
        search,
        inStock: stockFilterToInStock(stockFilter),
        published: publishedFilterToPublished(publishedFilter),
      })
      .then((response) => {
        setVeiculos(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      })
      .catch((err: unknown) => {
        console.error("[Motos] Erro ao carregar veículos:", err);
        toast.error(
          err instanceof Error && err.message
            ? `Erro ao carregar veículos: ${err.message}`
            : "Erro ao carregar veículos. Tente novamente."
        );
        setVeiculos([]);
        setTotalElements(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, debouncedSearchTerm, stockFilter, publishedFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleRefetch = () => {
    fetchVehicles();
  };

  const handleCadastroSuccess = () => {
    setModal(null);
    handleRefetch();
  };

  const hasActiveFilters =
    debouncedSearchTerm.trim() !== "" ||
    stockFilter !== "TODOS" ||
    publishedFilter !== "TODOS";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Motos</h1>
          <p className="text-ink-muted">
            Gerencie o inventário de motos. Pesquise, filtre e cadastre novos veículos.
          </p>
        </div>
        <Button onClick={() => setModal({ type: "create" })} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar veículo
        </Button>
      </div>

      <div className="rounded-card border border-line-soft bg-surface">
        <div className="flex flex-col gap-4 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <Input
              placeholder="Buscar por placa, marca ou modelo…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar estoque">
              <FilterChip
                active={stockFilter === "TODOS"}
                onClick={() => {
                  setStockFilter("TODOS");
                  setPage(0);
                }}
              >
                Todos
              </FilterChip>
              <FilterChip
                active={stockFilter === "SIM"}
                onClick={() => {
                  setStockFilter("SIM");
                  setPage(0);
                }}
              >
                Em estoque
              </FilterChip>
              <FilterChip
                active={stockFilter === "NAO"}
                onClick={() => {
                  setStockFilter("NAO");
                  setPage(0);
                }}
              >
                Fora de estoque
              </FilterChip>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar catálogo">
              <FilterChip
                active={publishedFilter === "TODOS"}
                onClick={() => {
                  setPublishedFilter("TODOS");
                  setPage(0);
                }}
              >
                Todas
              </FilterChip>
              <FilterChip
                active={publishedFilter === "PUBLICADOS"}
                onClick={() => {
                  setPublishedFilter("PUBLICADOS");
                  setPage(0);
                }}
              >
                Publicadas
              </FilterChip>
              <FilterChip
                active={publishedFilter === "NAO_PUBLICADOS"}
                onClick={() => {
                  setPublishedFilter("NAO_PUBLICADOS");
                  setPage(0);
                }}
              >
                Não publicadas
              </FilterChip>
            </div>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v) as (typeof PAGE_SIZE_OPTIONS)[number]);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Por página" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} por página
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-ink-muted">
              Carregando…
            </div>
          ) : veiculos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-ink-muted">
              <Bike className="h-10 w-10" />
              <p>
                {!hasActiveFilters
                  ? "Nenhum veículo cadastrado."
                  : "Nenhum resultado para os filtros aplicados."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setDebouncedSearchTerm("");
                    setStockFilter("TODOS");
                    setPublishedFilter("TODOS");
                    setPage(0);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Placa</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="w-16">Status</TableHead>
                    <TableHead className="w-20">Ano fab.</TableHead>
                    <TableHead className="w-20">Ano mod.</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead className="text-right">Quilometragem</TableHead>
                    <TableHead className="w-28">Estoque</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculos.map((v) => (
                    <TableRow key={v.licensePlate}>
                      <TableCell className="font-medium tabular-nums">{v.licensePlate}</TableCell>
                      <TableCell>{(v.brand ?? "").replace(/_/g, " ")}</TableCell>
                      <TableCell>{v.modelName}</TableCell>
                      <TableCell>
                        {v.published ? (
                          <span title="Publicado no catálogo" className="inline-flex items-center gap-1 text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs">Público</span>
                          </span>
                        ) : (
                          <span title="Não publicado" className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">{v.manufactureYear}</TableCell>
                      <TableCell className="tabular-nums">{v.modelYear}</TableCell>
                      <TableCell>
                        {v.color && isHexColor(v.color) ? (
                          <span
                            className="inline-block h-6 w-6 shrink-0 rounded border border-border"
                            style={{ backgroundColor: v.color }}
                            title={v.color}
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatKm(v.kilometersDriven)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.inStock ? "success" : "secondary"}>
                          {v.inStock ? "Em estoque" : "Fora"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar veículo"
                            onClick={() => setModal({ type: "edit", vehicle: v })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Link href={`/motos/${v.licensePlate}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-4 border-t px-2 md:px-4 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm text-muted-foreground">Itens por página:</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(v) => {
                          setPageSize(Number(v) as (typeof PAGE_SIZE_OPTIONS)[number]);
                          setPage(0);
                        }}
                      >
                        <SelectTrigger className="w-[80px] md:w-[100px] text-xs md:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalElements)} de {totalElements} {totalElements === 1 ? "veículo" : "veículos"}
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
                      {page + 1}/{Math.max(1, totalPages)}
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
        </div>
      </div>

      <Dialog open={modal !== null} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent showClose className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modal?.type === "edit" ? "Editar veículo" : "Cadastrar veículo"}
            </DialogTitle>
            <DialogDescription>
              {modal?.type === "edit"
                ? "Atualize os dados estruturais, inclusive a placa."
                : "Preencha os dados do veículo para adicionar ao estoque."}
            </DialogDescription>
          </DialogHeader>
          {modal?.type === "edit" ? (
            <FormVeiculo
              key={modal.vehicle.licensePlate}
              mode="edit"
              vehicle={modal.vehicle}
              currentPlate={modal.vehicle.licensePlate}
              insideModal
              onSuccess={handleCadastroSuccess}
            />
          ) : (
            <FormVeiculo insideModal onSuccess={handleCadastroSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
