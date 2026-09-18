"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { FormField } from "@/components/ui/form-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { digitsOnly, formatPhone, formatStoredPhone } from "@/lib/masks";
import type { VehicleInterest, VehicleInterestStatus } from "@/types";

function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message.trim();
  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error) return parsed.error;
  } catch {
    /* texto puro */
  }
  return raw || fallback;
}

function phoneForApi(raw: string): string {
  const digits = digitsOnly(raw);
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return digits;
}

type StatusFilter = "PENDING" | "ALL";

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusBadge(status: string) {
  if (status === "PENDING") {
    return <Badge variant="warning">Pendente</Badge>;
  }
  if (status === "COMPLETED") {
    return <Badge variant="success">Avisado</Badge>;
  }
  return <Badge variant="secondary">Cancelado</Badge>;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<VehicleInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [acting, setActing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [confirm, setConfirm] = useState<{
    type: "complete" | "cancel";
    lead: VehicleInterest;
  } | null>(null);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const status: VehicleInterestStatus | undefined =
      statusFilter === "PENDING" ? "PENDING" : undefined;
    api.interests
      .listar(page, pageSize, status)
      .then((response) => {
        setLeads(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar os leads.");
        setLeads([]);
        setTotalElements(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const applyFilter = (next: StatusFilter) => {
    setStatusFilter(next);
    setPage(0);
  };

  const resetCreateForm = () => {
    setNewPhone("");
    setNewBrand("");
    setNewModel("");
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const phone = phoneForApi(newPhone);
    const brand = newBrand.trim();
    const model = newModel.trim();
    if (phone.length < 10) {
      toast.error("Informe o WhatsApp com DDD (10 ou 11 dígitos).");
      return;
    }
    if (brand.length < 2 || model.length < 2) {
      toast.error("Marca e modelo são obrigatórios.");
      return;
    }
    setCreating(true);
    try {
      await api.interests.criar({ phone, brand, model });
      toast.success("Lead adicionado à lista de espera.");
      setCreateOpen(false);
      resetCreateForm();
      if (statusFilter === "PENDING" && page === 0) {
        fetchLeads();
      } else {
        setStatusFilter("PENDING");
        setPage(0);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível cadastrar o lead."));
    } finally {
      setCreating(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setActing(true);
    try {
      if (confirm.type === "complete") {
        await api.interests.completar(confirm.lead.id);
        toast.success("Lead finalizado manualmente.");
      } else {
        await api.interests.cancelar(confirm.lead.id);
        toast.success("Lead cancelado.");
      }
      setConfirm(null);
      fetchLeads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o lead.");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Leads (Espera)
          </h1>
          <p className="text-ink-muted">
            Clientes que pediram aviso quando a moto entrar no estoque. Dá para cadastrar na mão,
            além do bot.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo lead
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar leads">
        <FilterChip active={statusFilter === "PENDING"} onClick={() => applyFilter("PENDING")}>
          Pendentes
        </FilterChip>
        <FilterChip active={statusFilter === "ALL"} onClick={() => applyFilter("ALL")}>
          Todos
        </FilterChip>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum lead neste filtro.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Telefone do Cliente</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-14">
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {formatStoredPhone(lead.contactPhone)}
                      </TableCell>
                      <TableCell>{lead.desiredBrand}</TableCell>
                      <TableCell>{lead.desiredModel}</TableCell>
                      <TableCell>{statusBadge(lead.status)}</TableCell>
                      <TableCell>
                        {lead.status === "PENDING" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ações">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => setConfirm({ type: "complete", lead })}>
                                <Check className="h-4 w-4" />
                                Finalizar manualmente
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setConfirm({ type: "cancel", lead })}
                              >
                                <X className="h-4 w-4" />
                                Cancelar lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {totalElements} lead{totalElements === 1 ? "" : "s"}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page <= 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground sm:text-sm">
                    {totalPages === 0 ? "0/0" : `${page + 1}/${totalPages}`}
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
        </CardContent>
      </Card>

      <AlertDialog open={confirm != null} onOpenChange={(open) => !open && !acting && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === "cancel" ? "Cancelar lead?" : "Finalizar lead?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm ? (
                <>
                  {confirm.type === "cancel"
                    ? "O cliente deixa de receber o aviso automático quando a moto entrar no estoque."
                    : "Marca como avisado sem enviar o template do WhatsApp. Use se o contato já foi feito fora do sistema."}{" "}
                  {confirm.lead.desiredBrand} {confirm.lead.desiredModel} ·{" "}
                  {formatStoredPhone(confirm.lead.contactPhone)}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={acting}>
              {acting ? "Salvando…" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (creating) return;
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lead</DialogTitle>
            <DialogDescription>
              Mesmos dados do bot: WhatsApp com DDD, marca e modelo desejados.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleCreate}>
            <FormField name="lead-phone" label="WhatsApp" required>
              <Input
                id="lead-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(81) 99999-0000"
                value={newPhone}
                onChange={(event) => setNewPhone(formatPhone(event.target.value))}
              />
            </FormField>
            <FormField name="lead-brand" label="Marca" required>
              <Input
                id="lead-brand"
                placeholder="Honda"
                value={newBrand}
                onChange={(event) => setNewBrand(event.target.value)}
              />
            </FormField>
            <FormField name="lead-model" label="Modelo" required>
              <Input
                id="lead-model"
                placeholder="Pop 110i"
                value={newModel}
                onChange={(event) => setNewModel(event.target.value)}
              />
            </FormField>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={creating}
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Salvando…" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
