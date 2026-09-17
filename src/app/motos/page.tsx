"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Bike, ChevronLeft, ChevronRight, DollarSign, Eye, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FormVeiculo } from "@/components/forms/form-veiculo";
import { FormVenda } from "@/components/forms/form-venda";
import { isVehicleAvailable } from "@/lib/vehicle-status";
import { FilterChip } from "@/components/ui/filter-chip";
import { api } from "@/lib/api";
import { formatBRL, formatLicensePlate } from "@/lib/masks";
import { isFinanceRole } from "@/lib/roles";
import { useAuth } from "@/contexts/AuthContext";
import type { OwnershipKind, Vehicle } from "@/types";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;
const DEFAULT_SORT = "createdAt,desc";

type SortField =
  | "createdAt"
  | "licensePlate"
  | "brand"
  | "modelName"
  | "manufactureYear"
  | "modelYear"
  | "kilometersDriven"
  | "suggestedPrice";

function parseSort(sort: string): { field: string; dir: "asc" | "desc" } {
  const [field, dir] = sort.split(",");
  return { field: field || "createdAt", dir: dir === "asc" ? "asc" : "desc" };
}

function SortableHead({
  label,
  field,
  sort,
  onSort,
  className,
  defaultDir = "asc",
}: {
  label: string;
  field: SortField;
  sort: string;
  onSort: (next: string) => void;
  className?: string;
  defaultDir?: "asc" | "desc";
}) {
  const current = parseSort(sort);
  const active = current.field === field;
  const Icon = !active ? ArrowUpDown : current.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={className}
      aria-sort={active ? (current.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-md text-left font-medium text-ink-subtle hover:text-ink"
        title="Ordenar"
        onClick={() => {
          const nextDir = active ? (current.dir === "asc" ? "desc" : "asc") : defaultDir;
          onSort(`${field},${nextDir}`);
        }}
      >
        {label}
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </button>
    </TableHead>
  );
}

type StockFilter = "TODOS" | "SIM" | "NAO";
type PublishedFilter = "TODOS" | "PUBLICADOS" | "NAO_PUBLICADOS";
type OwnershipFilter = "TODOS" | OwnershipKind;

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
  const router = useRouter();
  const { user } = useAuth();
  const isFinance = isFinanceRole(user?.role);
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: "create" } | { type: "sell"; plate: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("TODOS");
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>("TODOS");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("TODOS");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState(DEFAULT_SORT);
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
        ownershipKind: ownershipFilter === "TODOS" ? undefined : ownershipFilter,
        sort,
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
  }, [page, pageSize, sort, debouncedSearchTerm, stockFilter, publishedFilter, ownershipFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleCadastroSuccess = (licensePlate: string) => {
    setModal(null);
    router.push(`/motos/${encodeURIComponent(formatLicensePlate(licensePlate))}`);
  };

  const applySort = (next: string) => {
    setSort(next);
    setPage(0);
  };

  const hasActiveFilters =
    debouncedSearchTerm.trim() !== "" ||
    stockFilter !== "TODOS" ||
    publishedFilter !== "TODOS" ||
    ownershipFilter !== "TODOS" ||
    sort !== DEFAULT_SORT;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Motos</h1>
          <p className="text-ink-muted">
            {isFinance
              ? "Vitrine interna para simulação. Sem custos, lucro ou ações de compra e venda."
              : "Gerencie o inventário de motos. Pesquise, filtre e cadastre novos veículos."}
          </p>
        </div>
        {!isFinance && (
        <Button onClick={() => setModal({ type: "create" })} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar veículo
        </Button>
        )}
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
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar propriedade">
              <FilterChip
                active={ownershipFilter === "TODOS"}
                onClick={() => {
                  setOwnershipFilter("TODOS");
                  setPage(0);
                }}
              >
                Todas as origens
              </FilterChip>
              <FilterChip
                active={ownershipFilter === "OWN"}
                onClick={() => {
                  setOwnershipFilter("OWN");
                  setPage(0);
                }}
              >
                Próprias
              </FilterChip>
              <FilterChip
                active={ownershipFilter === "THIRD_PARTY"}
                onClick={() => {
                  setOwnershipFilter("THIRD_PARTY");
                  setPage(0);
                }}
              >
                De terceiro
              </FilterChip>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Select
                value={sort}
                onValueChange={(value) => applySort(value)}
              >
                <SelectTrigger className="w-full sm:w-[220px]" aria-label="Ordenar listagem">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cadastro</SelectLabel>
                    <SelectItem value="createdAt,desc">Mais recente</SelectItem>
                    <SelectItem value="createdAt,asc">Mais antiga</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Preço e km</SelectLabel>
                    <SelectItem value="suggestedPrice,desc">Maior preço</SelectItem>
                    <SelectItem value="suggestedPrice,asc">Menor preço</SelectItem>
                    <SelectItem value="kilometersDriven,asc">Menor km</SelectItem>
                    <SelectItem value="kilometersDriven,desc">Maior km</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Ano</SelectLabel>
                    <SelectItem value="modelYear,desc">Ano modelo mais novo</SelectItem>
                    <SelectItem value="modelYear,asc">Ano modelo mais antigo</SelectItem>
                    <SelectItem value="manufactureYear,desc">Ano fabricação mais novo</SelectItem>
                    <SelectItem value="manufactureYear,asc">Ano fabricação mais antigo</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Alfabética</SelectLabel>
                    <SelectItem value="licensePlate,asc">Placa A–Z</SelectItem>
                    <SelectItem value="licensePlate,desc">Placa Z–A</SelectItem>
                    <SelectItem value="brand,asc">Marca A–Z</SelectItem>
                    <SelectItem value="brand,desc">Marca Z–A</SelectItem>
                    <SelectItem value="modelName,asc">Modelo A–Z</SelectItem>
                    <SelectItem value="modelName,desc">Modelo Z–A</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
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
                    setOwnershipFilter("TODOS");
                    setSort(DEFAULT_SORT);
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
                    <SortableHead label="Placa" field="licensePlate" sort={sort} onSort={applySort} className="w-28" />
                    <SortableHead label="Marca" field="brand" sort={sort} onSort={applySort} />
                    <SortableHead label="Modelo" field="modelName" sort={sort} onSort={applySort} />
                    <TableHead className="w-16">Status</TableHead>
                    <SortableHead
                      label="Ano fab."
                      field="manufactureYear"
                      sort={sort}
                      onSort={applySort}
                      className="w-24"
                      defaultDir="desc"
                    />
                    <SortableHead
                      label="Ano mod."
                      field="modelYear"
                      sort={sort}
                      onSort={applySort}
                      className="w-24"
                      defaultDir="desc"
                    />
                    <TableHead>Cor</TableHead>
                    <SortableHead
                      label="Quilometragem"
                      field="kilometersDriven"
                      sort={sort}
                      onSort={applySort}
                      className="text-right"
                      defaultDir="asc"
                    />
                    <SortableHead
                      label="Preço sugerido"
                      field="suggestedPrice"
                      sort={sort}
                      onSort={applySort}
                      className="text-right"
                      defaultDir="desc"
                    />
                    <TableHead className="w-28">Origem</TableHead>
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
                      <TableCell className="text-right tabular-nums">
                        {v.suggestedPrice != null ? formatBRL(v.suggestedPrice) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.ownershipKind === "THIRD_PARTY"
                          ? v.ownerName || "Terceiro"
                          : "Própria"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.inStock ? "success" : "secondary"}>
                          {v.inStock ? "Em estoque" : "Fora"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/motos/${v.licensePlate}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Abrir ficha">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {isVehicleAvailable(v) && !isFinance && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Vender veículo"
                              onClick={() => setModal({ type: "sell", plate: v.licensePlate })}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
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

      <Sheet modal={false} open={!isFinance && modal?.type === "create"} onOpenChange={(open) => !open && setModal(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Cadastrar veículo</SheetTitle>
            <SheetDescription>
              A lista de motos continua visível. Fotos e recorte ficam na ficha depois do cadastro.
            </SheetDescription>
          </SheetHeader>
          <FormVeiculo
            insideModal
            includePhotos={false}
            includeCatalogFields
            onSuccessWithPlate={handleCadastroSuccess}
          />
        </SheetContent>
      </Sheet>

      <Sheet modal={false} open={!isFinance && modal?.type === "sell"} onOpenChange={(open) => !open && setModal(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Vender Veículo</SheetTitle>
            <SheetDescription>A lista de motos continua visível à esquerda.</SheetDescription>
          </SheetHeader>
          {modal?.type === "sell" && (
            <FormVenda
              insideModal
              defaultPlate={modal.plate}
              onSuccess={() => {
                setModal(null);
                fetchVehicles();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
