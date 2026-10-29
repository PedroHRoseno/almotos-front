"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { STORE } from "@/lib/documents";

const keepWord = (word: string) => [word];

export const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 54,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#1c1917",
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#e10600",
  },
  kicker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 1.4,
    color: "#e10600",
  },
  legal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginTop: 2,
    color: "#111111",
  },
  meta: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 8,
    color: "#57534e",
  },
  rule: {
    height: 1,
    backgroundColor: "#e7e5e4",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  intro: {
    textAlign: "justify",
    marginBottom: 8,
  },
  parties: {
    flexDirection: "row",
    marginBottom: 10,
  },
  party: {
    width: "49%",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    padding: 8,
  },
  partyGap: {
    width: "2%",
  },
  partyTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 0.6,
    color: "#e10600",
    marginBottom: 3,
  },
  partyLine: {
    fontSize: 9,
    marginBottom: 1,
  },
  specs: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#d6d3d1",
    marginBottom: 10,
  },
  spec: {
    width: "50%",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#e7e5e4",
  },
  specLabel: {
    fontSize: 7,
    letterSpacing: 0.4,
    color: "#78716c",
    marginBottom: 1,
  },
  specValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  clause: {
    textAlign: "justify",
    marginBottom: 6,
  },
  clauseTitle: {
    fontFamily: "Helvetica-Bold",
  },
  closing: {
    textAlign: "justify",
    marginTop: 4,
    marginBottom: 8,
  },
  signRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  signCol: {
    width: "48%",
  },
  signGap: {
    width: "4%",
  },
  signLine: {
    marginTop: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1917",
    marginBottom: 4,
  },
  signName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  signRole: {
    fontSize: 8,
    color: "#57534e",
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#78716c",
    textAlign: "center",
  },
  amountLabel: {
    fontSize: 8,
    letterSpacing: 0.6,
    color: "#78716c",
    marginTop: 4,
  },
  amountValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    marginBottom: 2,
  },
  amountWords: {
    fontSize: 9,
    color: "#44403c",
    marginBottom: 10,
  },
  stubLabel: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 8,
    letterSpacing: 0.8,
    textAlign: "center",
    color: "#78716c",
  },
  stub: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#a8a29e",
    padding: 12,
  },
  stubTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 4,
  },
});

export function PdfShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Document
      title={title}
      author={STORE.legalName}
      subject={title}
      creator={STORE.tradeName}
      language="pt-BR"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.accent} fixed />
        <Text style={styles.kicker}>{STORE.tradeName.toUpperCase()}</Text>
        <Text style={styles.legal}>{STORE.legalName}</Text>
        <Text style={styles.meta}>
          {`CNPJ ${STORE.cnpj}  ·  ${STORE.cityLine}`}
        </Text>
        <View style={styles.rule} />
        <Text style={styles.title}>{title}</Text>
        {children}
        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${STORE.legalName}  ·  CNPJ ${STORE.cnpj}  ·  ${STORE.cityLine}  ·  ${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export function Parties({
  leftTitle,
  leftLines,
  rightTitle,
  rightLines,
}: {
  leftTitle: string;
  leftLines: string[];
  rightTitle: string;
  rightLines: string[];
}) {
  return (
    <View style={styles.parties}>
      <PartyCard title={leftTitle} lines={leftLines} />
      <View style={styles.partyGap} />
      <PartyCard title={rightTitle} lines={rightLines} />
    </View>
  );
}

function PartyCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={styles.party}>
      <Text style={styles.partyTitle}>{title.toUpperCase()}</Text>
      {lines.filter(Boolean).map((line, index) => (
        <Text key={`${title}-${index}`} style={styles.partyLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export function Specs({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <View style={styles.specs}>
      {rows
        .filter((row) => row.value.trim())
        .map((row) => (
          <View key={row.label} style={styles.spec}>
            <Text style={styles.specLabel}>{row.label.toUpperCase()}</Text>
            <Text style={styles.specValue}>{row.value}</Text>
          </View>
        ))}
    </View>
  );
}

export function Clause({ index, title, children }: { index: number; title: string; children: string }) {
  return (
    <Text style={styles.clause} hyphenationCallback={keepWord}>
      <Text style={styles.clauseTitle}>{`CLÁUSULA ${index}ª - ${title.toUpperCase()}. `}</Text>
      {children}
    </Text>
  );
}

export function Signatures({
  leftTitle,
  leftName,
  rightTitle,
  rightName,
}: {
  leftTitle: string;
  leftName: string;
  rightTitle: string;
  rightName: string;
}) {
  return (
    <View style={styles.signRow} wrap={false}>
      <SignColumn title={leftTitle} name={leftName} />
      <View style={styles.signGap} />
      <SignColumn title={rightTitle} name={rightName} />
    </View>
  );
}

function SignColumn({ title, name }: { title: string; name: string }) {
  return (
    <View style={styles.signCol}>
      <View style={styles.signLine} />
      <Text style={styles.signName}>{name}</Text>
      <Text style={styles.signRole}>{title}</Text>
    </View>
  );
}

export function vehicleRows(vehicle: {
  licensePlate: string;
  brandModel: string;
  year: string;
  color: string;
  kilometers: string;
  chassis: string;
  renavam: string;
}) {
  return [
    { label: "Placa", value: vehicle.licensePlate },
    { label: "Marca e modelo", value: vehicle.brandModel },
    { label: "Ano", value: vehicle.year },
    { label: "Cor", value: vehicle.color },
    { label: "Quilometragem", value: vehicle.kilometers },
    { label: "Chassi", value: vehicle.chassis },
    { label: "RENAVAM", value: vehicle.renavam },
  ];
}
