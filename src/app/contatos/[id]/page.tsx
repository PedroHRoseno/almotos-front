"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatBRL, formatDocumentOrDash } from "@/lib/masks";
import type { ContactReport, PartnerDetail, Vehicle } from "@/types";
import { FormParceiro } from "@/components/forms/form-parceiro";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function ContatoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;

  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [owned, setOwned] = useState<Vehicle[]>([]);
  const [report, setReport] = useState<ContactReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchPartnerDetail = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.customers.buscarPorId(partnerId),
      api.vehicles.listar(0, 50, { ownerId: partnerId }),
      api.reports.byContact({ partnerId, role: "owner,payout", size: 20 }),
    ])
      .then(([detail, vehicles, contactReport]) => {
        setPartner(detail);
        setOwned(vehicles.content || []);
        setReport(contactReport);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados do contato");
      })
      .finally(() => setLoading(false));
  }, [partnerId]);

  useEffect(() => {
    if (partnerId) fetchPartnerDetail();
  }, [partnerId, fetchPartnerDetail]);

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
        <Button variant="ghost" onClick={() => router.push("/contatos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "Contato não encontrado"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/contatos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{partner.name}</h1>
            <p className="text-muted-foreground">Detalhes do contato</p>
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
            <CardTitle>Informações pessoais</CardTitle>
            <CardDescription>Dados básicos do contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documento (CPF ou CNPJ)</p>
              <p className="text-lg">{formatDocumentOrDash(partner.document)}</p>
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Atividade</CardTitle>
            <CardDescription>Papéis derivados das transações</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Comprou da loja</p>
              <p className="text-2xl font-bold">{partner.totalSales}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vendeu para a loja</p>
              <p className="text-2xl font-bold">{partner.totalPurchases}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trocas</p>
              <p className="text-2xl font-bold">{partner.totalExchanges}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Motos como dono</p>
              <p className="text-2xl font-bold">{partner.ownedVehicles ?? 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Repasses recebidos</p>
              <p className="text-2xl font-bold">{formatBRL(partner.totalPayout ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lucro da loja nesses repasses</p>
              <p className="text-2xl font-bold">{formatBRL(partner.totalStoreProfitFromPayouts ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {owned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Motos deste dono</CardTitle>
            <CardDescription>Estoque consignado ou de parceria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {owned.map((vehicle) => (
              <Link
                key={vehicle.licensePlate}
                href={`/motos/${encodeURIComponent(vehicle.licensePlate)}`}
                className="flex justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
              >
                <span>
                  {vehicle.brand} {vehicle.modelName} · {vehicle.licensePlate}
                </span>
                <span className="text-muted-foreground">
                  {vehicle.ownershipKind === "THIRD_PARTY" ? "Terceiro" : "Própria"} · {vehicle.status}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {report && report.sales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendas com este contato (dono ou repasse)</CardTitle>
            <CardDescription>
              Volume {formatBRL(report.volume)} · Repasses {formatBRL(report.totalPayout)} · Lucro loja{" "}
              {formatBRL(report.totalStoreProfit)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.sales.map((sale) => (
              <div key={sale.id} className="flex justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  {sale.vehicleBrand} {sale.vehicleModel} · {sale.vehicleLicensePlate}
                </span>
                <span className="text-muted-foreground">
                  {formatBRL(sale.salePrice)} · repasse {formatBRL(sale.payoutAmount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar contato</DialogTitle>
            <DialogDescription>
              Atualize os dados. O CPF/CNPJ é opcional.
            </DialogDescription>
          </DialogHeader>
          <FormParceiro
            insideModal
            partnerId={partner.id}
            initialData={{
              document: partner.document || "",
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
            onSuccess={() => {
              setEditModalOpen(false);
              fetchPartnerDetail();
            }}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
