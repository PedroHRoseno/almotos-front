"use client";

import { useState, useEffect, useMemo } from "react";
import { Bike, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
import { api } from "@/lib/api";
import type { Vehicle } from "@/types";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

type StockFilter = "TODOS" | "SIM" | "NAO";

function formatKm(val: number) {
  return new Intl.NumberFormat("pt-BR").format(val) + " km";
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
function isHexColor(s: string | null | undefined): boolean {
  return !!s && HEX_REGEX.test(s);
}

export default function MotosPage() {
  const [veiculos, setVeiculos] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("TODOS");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchVehicles = (pageNum: number = 0, size: number = pageSize) => {
    setLoading(true);
    api.vehicles
      .listar(pageNum, size)
      .then((response) => {
        setVeiculos(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      })
      .catch(() => {
        setVeiculos([]);
        setTotalElements(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVehicles(page, pageSize);
  }, [page, pageSize]);

  const filtered = useMemo(() => {
    let list = veiculos;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (v) =>
          v.licensePlate.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.modelName.toLowerCase().includes(q) ||
          (v.color && v.color.toLowerCase().includes(q))
      );
    }
    if (stockFilter === "SIM") list = list.filter((v) => v.inStock || v.status === "DISPONIVEL");
    if (stockFilter === "NAO") list = list.filter((v) => !v.inStock || v.status === "VENDIDO");
    return list;
  }, [veiculos, search, stockFilter]);

  const handleRefetch = () => {
    fetchVehicles(page, pageSize);
  };

  const handleCadastroSuccess = () => {
    setModalOpen(false);
    handleRefetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Motos</h1>
          <p className="text-muted-foreground">
            Gerencie o inventário de motos. Pesquise, filtre e cadastre novos veículos.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar veículo
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa, marca, modelo ou cor…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={stockFilter}
            onValueChange={(v) => {
              setStockFilter(v as StockFilter);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estoque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="SIM">Em estoque</SelectItem>
              <SelectItem value="NAO">Fora de estoque</SelectItem>
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

        <div className="border-t">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              Carregando…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Bike className="h-10 w-10" />
              <p>
                {filtered.length === 0 && veiculos.length === 0
                  ? "Nenhum veículo cadastrado."
                  : "Nenhum resultado para os filtros aplicados."}
              </p>
              {filtered.length === 0 && veiculos.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStockFilter("TODOS");
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
                    <TableHead className="w-20">Ano fab.</TableHead>
                    <TableHead className="w-20">Ano mod.</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead className="text-right">Quilometragem</TableHead>
                    <TableHead className="w-28">Estoque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.licensePlate}>
                      <TableCell className="font-medium">{v.licensePlate}</TableCell>
                      <TableCell>{(v.brand ?? "").replace(/_/g, " ")}</TableCell>
                      <TableCell>{v.modelName}</TableCell>
                      <TableCell>{v.manufactureYear}</TableCell>
                      <TableCell>{v.modelYear}</TableCell>
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
                      <TableCell className="text-right">
                        {formatKm(v.kilometersDriven)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.inStock ? "success" : "secondary"}>
                          {v.inStock ? "Em estoque" : "Fora"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-4 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {page * pageSize + 1}–
                  {Math.min((page + 1) * pageSize, totalElements)} de{" "}
                  {totalElements}{" "}
                  {totalElements === 1 ? "veículo" : "veículos"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page <= 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page + 1} de {Math.max(1, totalPages)}
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
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent showClose className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar veículo</DialogTitle>
            <DialogDescription>
              Preencha os dados do veículo para adicionar ao estoque.
            </DialogDescription>
          </DialogHeader>
          <FormVeiculo insideModal onSuccess={handleCadastroSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
