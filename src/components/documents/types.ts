import type { DocumentKind } from "@/lib/documents";

export interface DocumentParty {
  name: string;
  document: string;
  phone: string;
  address: string;
}

export interface DocumentVehicleView {
  licensePlate: string;
  brandModel: string;
  year: string;
  color: string;
  kilometers: string;
  chassis: string;
  renavam: string;
}

/** Parcela pronta para impressão (promissória/carnê). Vem da conta a receber ou do formulário. */
export interface DocumentInstallmentView {
  label: string;
  dueDateLabel: string;
  dueDateLong: string;
  amountLabel: string;
  amountWords: string;
}

/** Textos já formatados para impressão. O PDF não calcula preço. */
export interface DocumentDraft {
  kind: DocumentKind;
  dateIso: string;
  dateLabel: string;
  amountLabel: string;
  amountWords: string;
  paymentMethod: string;
  party: DocumentParty;
  vehicle: DocumentVehicleView;
  /** Referência da dívida (descrição da conta a receber). */
  reference: string;
  /** Promissória: 1 item. Carnê: todas as parcelas. Vazio nos demais documentos. */
  installments: DocumentInstallmentView[];
}
