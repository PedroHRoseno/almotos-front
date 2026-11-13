"use client";

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { STORE } from "@/lib/documents";
import type { DocumentDraft, DocumentInstallmentView } from "./types";

/** Lâminas por folha A4. Quatro cabem com folga para corte. */
const SLIPS_PER_PAGE = 4;
const RED = "#e10600";

const s = StyleSheet.create({
  page: {
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 26,
    fontFamily: "Helvetica",
    fontSize: 8,
    lineHeight: 1.3,
    color: "#1c1917",
  },
  slip: {
    height: 186,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#1c1917",
  },
  cut: {
    height: 12,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  cutLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 6,
    borderTopWidth: 1,
    borderTopColor: "#a8a29e",
    borderStyle: "dashed",
  },
  cutLabel: {
    fontSize: 6.5,
    color: "#78716c",
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    letterSpacing: 0.8,
  },
  stub: {
    width: "31%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#a8a29e",
    borderStyle: "dashed",
  },
  receipt: {
    width: "69%",
    padding: 8,
  },
  tag: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    letterSpacing: 1,
    color: RED,
    marginBottom: 4,
  },
  label: {
    fontSize: 6,
    letterSpacing: 0.5,
    color: "#78716c",
  },
  value: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 3,
  },
  small: {
    fontSize: 7.5,
    marginBottom: 3,
  },
  writeLine: {
    marginTop: 9,
    borderBottomWidth: 0.75,
    borderBottomColor: "#57534e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: RED,
    paddingBottom: 4,
    marginBottom: 5,
  },
  logo: {
    width: 52,
    height: 23,
  },
  brand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: RED,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  legal: {
    fontSize: 6.5,
    color: "#57534e",
  },
  receiptBody: {
    flexDirection: "row",
  },
  receiptInfo: {
    width: "60%",
    paddingRight: 8,
  },
  receiptBoxes: {
    width: "40%",
  },
  box: {
    borderWidth: 1,
    borderColor: "#d6d3d1",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 3,
    flexShrink: 0,
  },
  boxStrong: {
    borderWidth: 1.5,
    borderColor: "#1c1917",
    backgroundColor: "#fafaf9",
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  amount: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
  },
  signArea: {
    marginTop: 8,
  },
  signLine: {
    marginTop: 16,
    borderBottomWidth: 0.75,
    borderBottomColor: "#1c1917",
    marginBottom: 2,
  },
});

function Field({ label, value, strong = true }: { label: string; value: string; strong?: boolean }) {
  return (
    <View>
      <Text style={s.label}>{label.toUpperCase()}</Text>
      <Text style={strong ? s.value : s.small}>{value}</Text>
    </View>
  );
}

function Slip({
  item,
  draft,
  logoSrc,
}: {
  item: DocumentInstallmentView;
  draft: DocumentDraft;
  logoSrc?: string | null;
}) {
  const vehicle = draft.vehicle;
  const hasVehicle = vehicle.brandModel !== "não informado";
  const reference = [draft.reference.trim(), hasVehicle ? `${vehicle.brandModel} · ${vehicle.licensePlate}` : ""]
    .filter(Boolean)
    .join(" — ");

  return (
    <View style={s.slip} wrap={false}>
      <View style={s.stub}>
        <Text style={s.tag}>CANHOTO DA LOJA</Text>
        <Field label="Parcela" value={item.label} />
        <Field label="Vencimento" value={item.dueDateLabel} />
        <Field label="Valor" value={item.amountLabel} />
        <Field label="Cliente" value={draft.party.name} strong={false} />
        <Text style={s.label}>DATA DO PAGAMENTO</Text>
        <View style={s.writeLine} />
        <Text style={[s.label, { marginTop: 6 }]}>VISTO</Text>
        <View style={s.writeLine} />
      </View>

      <View style={s.receipt}>
        <View style={s.header}>
          {logoSrc ? <Image src={logoSrc} style={s.logo} /> : <Text style={s.brand}>{STORE.tradeName.toUpperCase()}</Text>}
          <View style={s.headerRight}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8 }}>{`${STORE.tradeName} ${STORE.city}`}</Text>
            <Text style={s.legal}>{`${STORE.legalName} · CNPJ ${STORE.cnpj}`}</Text>
          </View>
        </View>

        <View style={s.receiptBody}>
          <View style={s.receiptInfo}>
            <Text style={s.tag}>RECIBO DO CLIENTE</Text>
            <Field label="Cliente" value={draft.party.name} />
            <Field label="CPF/CNPJ" value={draft.party.document.replace(/^CPF\/CNPJ\s*/, "")} strong={false} />
            <Field label="Referência" value={reference || "—"} strong={false} />
          </View>
          <View style={s.receiptBoxes}>
            <View style={s.box}>
              <Text style={s.label}>PARCELA</Text>
              <Text style={s.value}>{item.label}</Text>
            </View>
            <View style={s.box}>
              <Text style={s.label}>VENCIMENTO</Text>
              <Text style={s.value}>{item.dueDateLabel}</Text>
            </View>
            <View style={s.boxStrong}>
              <Text style={s.label}>VALOR</Text>
              <Text style={s.amount}>{item.amountLabel}</Text>
            </View>
          </View>
        </View>

        <View style={s.signArea}>
          <View style={s.signLine} />
          <Text style={s.legal}>{`Recebi a parcela acima. Data ___/___/______ · ${STORE.tradeName}`}</Text>
        </View>
      </View>
    </View>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

export function PaymentBookletPdf({ draft, logoSrc }: { draft: DocumentDraft; logoSrc?: string | null }) {
  const pages = chunk(draft.installments, SLIPS_PER_PAGE);
  const title = `Carnê de pagamento - ${draft.party.name}`;

  return (
    <Document title={title} author={STORE.legalName} subject={title} creator={STORE.tradeName} language="pt-BR">
      {pages.length === 0 ? (
        <Page size="A4" style={s.page}>
          <Text style={{ fontSize: 11, textAlign: "center", marginTop: 120, color: "#57534e" }}>
            Informe o valor total, o número de parcelas e o 1º vencimento, ou abra uma conta a receber.
          </Text>
        </Page>
      ) : (
        pages.map((slips, pageIndex) => (
          <Page key={pageIndex} size="A4" style={s.page}>
            {slips.map((item, index) => (
              <View key={item.label}>
                {index > 0 ? (
                  <View style={s.cut}>
                    <View style={s.cutLine} />
                    <Text style={s.cutLabel}>CORTE AQUI</Text>
                  </View>
                ) : null}
                <Slip item={item} draft={draft} logoSrc={logoSrc} />
              </View>
            ))}
          </Page>
        ))
      )}
    </Document>
  );
}
