export const STORE = {
  legalName: "ROSENO E SILVA COMERCIO DE VEICULOS LTDA",
  tradeName: "AL Motos",
  cnpj: "68.967.245/0001-26",
  city: "Caruaru",
  state: "PE",
  stateName: "Pernambuco",
  cityLine: "Caruaru-PE",
} as const;

export const DOCUMENT_KINDS = [
  { value: "contrato", label: "Contrato de compra e venda" },
  { value: "recibo", label: "Recibo de pagamento / sinal" },
  { value: "consignacao", label: "Termo de consignação" },
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number]["value"];

const UNITS = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const TEENS = [
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function underThousand(value: number): string {
  if (value === 0) return "";
  if (value === 100) return "cem";
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (hundreds) parts.push(HUNDREDS[hundreds]);
  if (rest >= 20) {
    const ten = Math.floor(rest / 10);
    const unit = rest % 10;
    parts.push(unit ? `${TENS[ten]} e ${UNITS[unit]}` : TENS[ten]);
  } else if (rest >= 10) {
    parts.push(TEENS[rest - 10]);
  } else if (rest > 0) {
    parts.push(UNITS[rest]);
  }
  return parts.join(" e ");
}

function inteiroPorExtenso(value: number): string {
  if (value === 0) return "zero";
  const millions = Math.floor(value / 1_000_000);
  const thousands = Math.floor((value % 1_000_000) / 1000);
  const rest = value % 1000;
  const parts: string[] = [];
  if (millions) {
    parts.push(millions === 1 ? "um milhão" : `${underThousand(millions)} milhões`);
  }
  if (thousands) {
    parts.push(thousands === 1 ? "mil" : `${underThousand(thousands)} mil`);
  }
  if (rest) parts.push(underThousand(rest));
  return parts.join(" e ");
}

/** Valor por extenso em reais. Não calcula parcela, juros nem desconto. */
export function valorPorExtenso(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 999_999_999.99) return "";
  const total = Math.round(value * 100);
  const reais = Math.floor(total / 100);
  const cents = total % 100;
  const reaisUnit = reais === 1 ? "real" : "reais";
  const reaisWords = inteiroPorExtenso(reais);
  const reaisLabel =
    reais === 0 ? "" : reais % 1_000_000 === 0 ? `${reaisWords} de ${reaisUnit}` : `${reaisWords} ${reaisUnit}`;
  const centsLabel = cents === 0 ? "" : `${inteiroPorExtenso(cents)} ${cents === 1 ? "centavo" : "centavos"}`;
  if (reaisLabel && centsLabel) return `${reaisLabel} e ${centsLabel}`;
  return reaisLabel || centsLabel || "zero real";
}

export function todayLocalIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatLongDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return isoDate;
  return `${Number(match[3])} de ${month} de ${match[1]}`;
}

export function readDocumentKind(value: string | null | undefined): DocumentKind {
  if (value === "recibo" || value === "consignacao" || value === "contrato") return value;
  return "contrato";
}

export function parseDocumentAmount(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export function documentFileName(kind: DocumentKind, plate: string, dateIso: string): string {
  const prefix = kind === "recibo" ? "recibo" : kind === "consignacao" ? "termo-consignacao" : "contrato";
  const safePlate = plate.replace(/[^a-zA-Z0-9]+/g, "") || "moto";
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(dateIso) ? dateIso : "sem-data";
  return `${prefix}-${safePlate}-${safeDate}.pdf`;
}

export function buildDocumentHref(input: {
  vehicleId?: string | null;
  contactId?: string | null;
  type?: DocumentKind;
  amount?: number | null;
  date?: string | null;
}): string {
  const params = new URLSearchParams();
  if (input.vehicleId) params.set("vehicleId", input.vehicleId);
  if (input.contactId) params.set("contactId", input.contactId);
  if (input.type) params.set("type", input.type);
  if (input.amount != null && Number.isFinite(input.amount) && input.amount >= 0) {
    params.set("amount", String(input.amount));
  }
  if (input.date) {
    const iso = input.date.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) params.set("date", iso);
  }
  const query = params.toString();
  return query ? `/documentos?${query}` : "/documentos";
}
