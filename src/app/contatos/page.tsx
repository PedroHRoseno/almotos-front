"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, ChevronLeft, ChevronRight, Eye, Pencil, Loader2, Search, X } from "lucide-react";
import Link from "next/link";
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
import { api } from "@/lib/api";
import { formatDocumentOrDash, formatPhoneOrDash } from "@/lib/masks";
import type { PartnerDetail, PartnerSummary } from "@/types";
import { FormParceiro } from "@/components/forms/form-parceiro";

export default function ContatosPage() {
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerDetail | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPartners = useCallback(() => {
    setLoading(true);
    const search = debouncedSearchTerm.trim() || undefined;
    api.customers
      .listar(page, pageSize, search)
      .then((response) => {
        setPartners(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      })
      .catch(() => {
        setPartners([]);
        setTotalElements(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleEditClick = async (id: string) => {
    setLoadingEdit(true);
    try {
      const detail = await api.customers.buscarPorId(id);
      setEditingPartner(detail);
      setEditModalOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar contato para edição");
    } finally {
      setLoadingEdit(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Contatos</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Pessoas e empresas da operação: compradores, fornecedores, consignantes e corretores.
            O papel aparece nas transações, não no cadastro.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo contato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de contatos
          </CardTitle>
          <CardDescription>
            {totalElements} {totalElements === 1 ? "contato cadastrado" : "contatos cadastrados"}
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
                placeholder="Buscar por documento ou nome..."
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
          ) : partners.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum contato cadastrado ainda.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Documento</TableHead>
                      <TableHead className="min-w-[180px]">Nome</TableHead>
                      <TableHead className="min-w-[140px]">Telefone</TableHead>
                      <TableHead className="min-w-[150px]">Cidade</TableHead>
                      <TableHead className="w-[180px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner) => (
                      <TableRow key={partner.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs md:text-sm">
                          {formatDocumentOrDash(partner.document)}
                        </TableCell>
                        <TableCell className="font-medium text-sm md:text-base">{partner.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs md:text-sm">
                          {formatPhoneOrDash(partner.phoneNumber1)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs md:text-sm">
                          {partner.city || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs md:text-sm"
                              disabled={loadingEdit}
                              onClick={() => handleEditClick(partner.id)}
                            >
                              <Pencil className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Link href={`/contatos/${partner.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs md:text-sm">
                                <Eye className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                                <span className="hidden sm:inline">Detalhes</span>
                              </Button>
                            </Link>
                          </div>
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
                    <Select
                      value={String(pageSize)}
                      onValueChange={(newSize) => {
                        setPageSize(Number(newSize));
                        setPage(0);
                      }}
                    >
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
                    Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalElements)} de {totalElements} contatos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page <= 0}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar contato</DialogTitle>
            <DialogDescription>
              Preencha os dados. O endereço é opcional. Sem categoria fixa — o mesmo contato pode comprar, vender ou consignar.
            </DialogDescription>
          </DialogHeader>
          <FormParceiro insideModal onSuccess={() => { setModalOpen(false); fetchPartners(); }} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingPartner(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar contato</DialogTitle>
            <DialogDescription>
              Atualize os dados. O CPF/CNPJ é opcional.
            </DialogDescription>
          </DialogHeader>
          {editingPartner && (
            <FormParceiro
              key={editingPartner.id}
              insideModal
              isEdit
              partnerId={editingPartner.id}
              initialData={{
                document: editingPartner.document || "",
                name: editingPartner.name,
                phoneNumber1: editingPartner.phoneNumber1 || "",
                phoneNumber2: editingPartner.phoneNumber2 || "",
                address: editingPartner.address
                  ? {
                      streetName: editingPartner.address.streetName || "",
                      number: editingPartner.address.number || "",
                      city: editingPartner.address.city || "",
                      state: editingPartner.address.state || "",
                      reference: editingPartner.address.reference || "",
                      zipCode: editingPartner.address.zipCode || "",
                    }
                  : undefined,
              }}
              onSuccess={() => {
                setEditModalOpen(false);
                setEditingPartner(null);
                fetchPartners();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
