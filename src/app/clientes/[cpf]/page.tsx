"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { PartnerDetail } from "@/types";
import { FormParceiro } from "@/components/forms/form-parceiro";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cpf = params.cpf as string;
  
  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (cpf) {
      fetchPartnerDetail();
    }
  }, [cpf]);

  const fetchPartnerDetail = () => {
    setLoading(true);
    setError(null);
    api.customers
      .buscarPorCpf(cpf)
      .then((data) => {
        setPartner(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados do parceiro");
      })
      .finally(() => setLoading(false));
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    fetchPartnerDetail();
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "-";
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => router.push("/clientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "Parceiro não encontrado"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/clientes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{partner.name}</h1>
            <p className="text-muted-foreground">Detalhes do parceiro</p>
          </div>
        </div>
        <Button onClick={() => setEditModalOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Dados básicos do parceiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-lg">{formatCpf(partner.cpf)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-lg">{partner.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone 1</p>
              <p className="text-lg">{formatPhone(partner.phoneNumber1)}</p>
            </div>
            {partner.phoneNumber2 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone 2</p>
                <p className="text-lg">{formatPhone(partner.phoneNumber2)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {partner.address && (
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Informações de localização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {partner.address.streetName && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rua</p>
                  <p className="text-lg">{partner.address.streetName}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número</p>
                <p className="text-lg">{partner.address.number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cidade</p>
                <p className="text-lg">{partner.address.city}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <p className="text-lg">{partner.address.state}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CEP</p>
                <p className="text-lg">
                  {partner.address.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2")}
                </p>
              </div>
              {partner.address.reference && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Referência</p>
                  <p className="text-lg">{partner.address.reference}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
            <CardDescription>Histórico de operações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
              <p className="text-2xl font-bold">{partner.totalSales}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Compras</p>
              <p className="text-2xl font-bold">{partner.totalPurchases}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Trocas</p>
              <p className="text-2xl font-bold">{partner.totalExchanges}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Parceiro</DialogTitle>
            <DialogDescription>
              Atualize os dados do parceiro. O CPF não pode ser alterado.
            </DialogDescription>
          </DialogHeader>
          <FormParceiro
            insideModal
            initialData={{
              cpf: partner.cpf,
              name: partner.name,
              phoneNumber1: partner.phoneNumber1 || "",
              phoneNumber2: partner.phoneNumber2 || "",
              address: partner.address
                ? {
                    streetName: partner.address.streetName || "",
                    number: partner.address.number || "",
                    city: partner.address.city || "",
                    state: partner.address.state || "",
                    reference: partner.address.reference || "",
                    zipCode: partner.address.zipCode || "",
                  }
                : undefined,
            }}
            onSuccess={handleEditSuccess}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

