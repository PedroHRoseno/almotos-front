"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { api } from "@/lib/api";
import {
  DOCUMENT_KINDS,
  formatLongDate,
  parseDocumentAmount,
  readDocumentKind,
  STORE,
  todayLocalIso,
  valorPorExtenso,
  type DocumentKind,
} from "@/lib/documents";
import { formatBRL, formatDocument, formatStoredPhone, partnerSelectLabel } from "@/lib/masks";
import { plateLabel, vehicleKey } from "@/lib/vehicle-ref";
import type { Address, PartnerDetail, PartnerSummary, Vehicle } from "@/types";
import type { DocumentDraft } from "./types";

const DocumentPreview = dynamic(
  () => import("@/components/documents/document-preview").then((mod) => mod.DocumentPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[720px] items-center justify-center rounded-xl border border-line">
        <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
      </div>
    ),
  }
);

const KIND_HINT: Record<DocumentKind, string> = {
  contrato: "O contato entra como comprador. A loja entra como vendedora.",
  recibo: "O contato entra como pagador. A loja assina o recibo.",
  consignacao: "O contato entra como consignante. A loja recebe o veículo sem ficar dona dele.",
};

const AMOUNT_LABEL: Record<DocumentKind, string> = {
  contrato: "Valor da venda",
  recibo: "Valor recebido",
  consignacao: "Valor de referência",
};

export function DocumentosWorkspace() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const amountSource = useRef<"user" | "query" | "auto" | "empty">(
    parseDocumentAmount(searchParams.get("amount")) != null ? "query" : "empty"
  );
  const previousPlate = useRef<string | null>(null);

  const [kind, setKind] = useState<DocumentKind>(() => readDocumentKind(searchParams.get("type")));
  const [vehicleId, setVehicleId] = useState(() => searchParams.get("vehicleId") ?? "");
  const [contactId, setContactId] = useState(() => searchParams.get("contactId") ?? "");
  const [amount, setAmount] = useState<number | undefined>(() => parseDocumentAmount(searchParams.get("amount")));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [date, setDate] = useState(() => {
    const param = searchParams.get("date");
    return param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : todayLocalIso();
  });
  const [chassis, setChassis] = useState("");
  const [renavam, setRenavam] = useState("");

  const [vehicleQuery, setVehicleQuery] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [vehicleOptions, setVehicleOptions] = useState<Vehicle[]>([]);
  const [contactOptions, setContactOptions] = useState<PartnerSummary[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [contact, setContact] = useState<PartnerDetail | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(query);
    const nextVehicle = params.get("vehicleId");
    const nextContact = params.get("contactId");
    const nextType = params.get("type");
    const nextDate = params.get("date");
    const nextAmount = parseDocumentAmount(params.get("amount"));
    if (nextVehicle) setVehicleId(nextVehicle);
    if (nextContact) setContactId(nextContact);
    if (nextType) setKind(readDocumentKind(nextType));
    if (nextDate && /^\d{4}-\d{2}-\d{2}$/.test(nextDate)) setDate(nextDate);
    if (nextAmount != null) {
      setAmount(nextAmount);
      amountSource.current = "query";
    }
  }, [query]);

  useEffect(() => {
    if (previousPlate.current == null) {
      previousPlate.current = vehicleId;
      return;
    }
    if (previousPlate.current !== vehicleId) {
      previousPlate.current = vehicleId;
      setChassis("");
      setRenavam("");
    }
  }, [vehicleId]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setVehiclesLoading(true);
      api.vehicles
        .listar(0, 20, { search: vehicleQuery.trim() || undefined })
        .then((response) => {
          if (!cancelled) setVehicleOptions(response.content || []);
        })
        .catch(() => {
          if (!cancelled) setVehicleOptions([]);
        })
        .finally(() => {
          if (!cancelled) setVehiclesLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [vehicleQuery]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setContactsLoading(true);
      api.customers
        .listar(0, 20, contactQuery.trim() || undefined)
        .then((response) => {
          if (!cancelled) setContactOptions(response.content || []);
        })
        .catch(() => {
          if (!cancelled) setContactOptions([]);
        })
        .finally(() => {
          if (!cancelled) setContactsLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [contactQuery]);

  useEffect(() => {
    const plate = vehicleId.trim();
    if (!plate) {
      setVehicle(null);
      setVehicleError(null);
      return;
    }
    let cancelled = false;
    setVehicleError(null);
    api.vehicles
      .buscarPorPlaca(plate)
      .then((data) => {
        if (!cancelled) setVehicle(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setVehicle(null);
          setVehicleError(error instanceof Error ? error.message : "Moto não encontrada.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  useEffect(() => {
    const id = contactId.trim();
    if (!id) {
      setContact(null);
      setContactError(null);
      return;
    }
    let cancelled = false;
    setContactError(null);
    api.customers
      .buscarPorId(id)
      .then((data) => {
        if (!cancelled) setContact(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setContact(null);
          setContactError(error instanceof Error ? error.message : "Contato não encontrado.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  useEffect(() => {
    if (amountSource.current === "user" || amountSource.current === "query") return;
    if (vehicle?.suggestedPrice != null && vehicle.suggestedPrice > 0) {
      setAmount(vehicle.suggestedPrice);
      amountSource.current = "auto";
      return;
    }
    if (amountSource.current === "auto") {
      setAmount(undefined);
      amountSource.current = "empty";
    }
  }, [vehicle]);

  const vehicleSelectOptions = useMemo(() => {
    const options = vehicleOptions.map((item) => ({
      value: vehicleKey(item),
      label: `${item.brand.replace(/_/g, " ")} ${item.modelName} (${item.modelYear}) - ${plateLabel(item.licensePlate)}`,
      searchText: `${item.brand} ${item.modelName} ${item.licensePlate ?? ""} ${item.color}`,
    }));
    if (vehicle && !options.some((option) => option.value === vehicleKey(vehicle))) {
      options.unshift({
        value: vehicleKey(vehicle),
        label: `${vehicle.brand.replace(/_/g, " ")} ${vehicle.modelName} (${vehicle.modelYear}) - ${plateLabel(vehicle.licensePlate)}`,
        searchText: `${vehicle.brand} ${vehicle.modelName} ${vehicle.licensePlate ?? ""} ${vehicle.color}`,
      });
    }
    return options;
  }, [vehicle, vehicleOptions]);

  const contactSelectOptions = useMemo(() => {
    const options = contactOptions.map((item) => ({
      value: item.id,
      label: partnerSelectLabel(item.name, item.document, item.city),
      searchText: `${item.name} ${item.document || ""} ${item.phoneNumber1 || ""} ${item.city || ""}`,
    }));
    if (contact && !options.some((option) => option.value === contact.id)) {
      options.unshift({
        value: contact.id,
        label: partnerSelectLabel(contact.name, contact.document, contact.address?.city),
        searchText: `${contact.name} ${contact.document || ""} ${contact.phoneNumber1 || ""}`,
      });
    }
    return options;
  }, [contact, contactOptions]);

  const draft = useMemo(
    () =>
      buildDraft({
        kind,
        vehicle,
        vehicleId,
        contact,
        amount,
        paymentMethod,
        date,
        chassis,
        renavam,
      }),
    [kind, vehicle, vehicleId, contact, amount, paymentMethod, date, chassis, renavam]
  );
  const previewDraft = useDebouncedValue(draft, 350);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">Documentos</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          {STORE.legalName} · CNPJ {STORE.cnpj} · {STORE.cityLine}. O PDF é gerado neste navegador.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados do documento
            </CardTitle>
            <CardDescription>{KIND_HINT[kind]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-kind">Tipo de documento</Label>
              <Select value={kind} onValueChange={(value) => setKind(readDocumentKind(value))}>
                <SelectTrigger id="document-kind">
                  <SelectValue placeholder="Escolha o documento" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_KINDS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Moto</Label>
              <SearchableSelect
                options={vehicleSelectOptions}
                value={vehicleId || undefined}
                onValueChange={(value) => {
                  const next = value ?? "";
                  setVehicleId(next);
                  const found = vehicleOptions.find((item) => item.licensePlate === next) ?? null;
                  setVehicle(found);
                }}
                onSearchChange={setVehicleQuery}
                placeholder={
                  vehiclesLoading && !vehicle
                    ? "Buscando motos..."
                    : vehicleId && !vehicle && !vehicleError
                      ? `Carregando ${vehicleId}...`
                      : "Buscar moto por placa ou modelo"
                }
                emptyMessage={vehiclesLoading ? "Buscando..." : "Nenhuma moto encontrada"}
                allowClear
              />
              {vehicleError ? <p className="text-xs text-destructive">{vehicleError}</p> : null}
              {vehicle ? (
                <p className="text-xs text-muted-foreground">
                  {vehicle.brand.replace(/_/g, " ")} {vehicle.modelName} · {formatVehicleYear(vehicle)} · {vehicle.color} ·{" "}
                  {plateLabel(vehicle.licensePlate)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Selecione uma moto para levar placa, ano, modelo e cor ao PDF.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Contato</Label>
              <SearchableSelect
                options={contactSelectOptions}
                value={contactId || undefined}
                onValueChange={(value) => setContactId(value ?? "")}
                onSearchChange={setContactQuery}
                placeholder={
                  contactsLoading && !contact
                    ? "Buscando contatos..."
                    : contactId && !contact && !contactError
                      ? "Carregando contato..."
                      : "Buscar contato por nome ou documento"
                }
                emptyMessage={contactsLoading ? "Buscando..." : "Nenhum contato encontrado"}
                allowClear
              />
              {contactError ? <p className="text-xs text-destructive">{contactError}</p> : null}
              {contact ? (
                <p className="text-xs text-muted-foreground">
                  {contact.name}
                  {contact.document ? ` · ${formatDocument(contact.document)}` : ""}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="document-amount">{AMOUNT_LABEL[kind]}</Label>
                <CurrencyInput
                  id="document-amount"
                  value={amount}
                  onValueChange={(value) => {
                    amountSource.current = "user";
                    setAmount(value);
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-date">Data</Label>
                <Input id="document-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-payment">Forma de pagamento</Label>
              <Input
                id="document-payment"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                placeholder="Pix, dinheiro, transferência, cartão..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="document-chassis">Chassi</Label>
                <Input
                  id="document-chassis"
                  value={chassis}
                  onChange={(event) => setChassis(event.target.value.toUpperCase())}
                  placeholder="Se houver"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-renavam">RENAVAM</Label>
                <Input
                  id="document-renavam"
                  value={renavam}
                  onChange={(event) => setRenavam(event.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="Se houver"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              O cadastro da moto não guarda chassi nem RENAVAM. O PDF só imprime o que for preenchido aqui.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
            <CardDescription>O PDF acompanha o formulário. Baixe ou imprima quando o texto estiver certo.</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentPreview draft={previewDraft} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function buildDraft(input: {
  kind: DocumentKind;
  vehicle: Vehicle | null;
  vehicleId: string;
  contact: PartnerDetail | null;
  amount: number | undefined;
  paymentMethod: string;
  date: string;
  chassis: string;
  renavam: string;
}): DocumentDraft {
  const dateIso = /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : todayLocalIso();
  const payment = input.paymentMethod.trim() || "não informada";
  return {
    kind: input.kind,
    dateIso,
    dateLabel: formatLongDate(dateIso),
    amountLabel: input.amount != null ? formatBRL(input.amount) : "não informado",
    amountWords: input.amount != null ? valorPorExtenso(input.amount) : "",
    paymentMethod: payment,
    party: {
      name: input.contact?.name?.trim() || "contato não selecionado",
      document: input.contact?.document ? `CPF/CNPJ ${formatDocument(input.contact.document)}` : "CPF/CNPJ não informado",
      phone: formatPartyPhone(input.contact),
      address: formatPartyAddress(input.contact?.address),
    },
    vehicle: input.vehicle
      ? {
          licensePlate: plateLabel(input.vehicle.licensePlate),
          brandModel: `${input.vehicle.brand.replace(/_/g, " ")} ${input.vehicle.modelName}`.trim(),
          year: formatVehicleYear(input.vehicle),
          color: input.vehicle.color?.trim() || "não informada",
          kilometers: `${new Intl.NumberFormat("pt-BR").format(input.vehicle.kilometersDriven)} km`,
          chassis: input.chassis.trim(),
          renavam: input.renavam.trim(),
        }
      : {
          licensePlate: input.vehicleId.trim() || "não informada",
          brandModel: "não informado",
          year: "não informado",
          color: "não informada",
          kilometers: "não informada",
          chassis: input.chassis.trim(),
          renavam: input.renavam.trim(),
        },
  };
}

function formatVehicleYear(vehicle: Vehicle): string {
  if (vehicle.manufactureYear && vehicle.modelYear && vehicle.manufactureYear !== vehicle.modelYear) {
    return `${vehicle.manufactureYear}/${vehicle.modelYear}`;
  }
  return String(vehicle.modelYear || vehicle.manufactureYear || "não informado");
}

function formatPartyPhone(contact: PartnerDetail | null): string {
  if (!contact) return "telefone não informado";
  const phones = [contact.phoneNumber1, contact.phoneNumber2]
    .map((phone) => formatStoredPhone(phone))
    .filter((phone) => phone !== "—");
  return phones.length ? phones.join(" / ") : "telefone não informado";
}

function formatPartyAddress(address?: Address): string {
  if (!address) return "endereço não informado";
  const street = [address.streetName, address.number].filter((part) => part?.trim()).join(", ");
  const city = [address.city, address.state].filter((part) => part?.trim()).join("/");
  const zip = address.zipCode?.trim() ? `CEP ${address.zipCode.trim()}` : "";
  const text = [street, city, zip].filter(Boolean).join(" - ");
  return text || "endereço não informado";
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
