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
}
