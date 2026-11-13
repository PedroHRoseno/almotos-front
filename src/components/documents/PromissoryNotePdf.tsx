"use client";

import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { STORE } from "@/lib/documents";
import type { DocumentDraft } from "./types";
import { Clause, Parties, PdfShell, Specs, styles, vehicleRows } from "./pdf-theme";

const keepWord = (word: string) => [word];

const local = StyleSheet.create({
  headline: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#1c1917",
    marginBottom: 10,
  },
  headCell: {
    flexGrow: 1,
    flexBasis: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderColor: "#1c1917",
  },
  headCellLast: {
    flexGrow: 1.4,
    flexBasis: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#fafaf9",
  },
  headLabel: {
    fontSize: 7,
    letterSpacing: 0.6,
    color: "#78716c",
  },
  headValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  headAmount: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
  },
  promise: {
    textAlign: "justify",
    fontSize: 10.5,
    lineHeight: 1.45,
    marginBottom: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#e10600",
    backgroundColor: "#fafaf9",
  },
  signLine: {
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1917",
    marginBottom: 3,
  },
});

function SignBlock({ name, role }: { name: string; role: string }) {
  return (
    <View style={styles.signCol}>
      <View style={local.signLine} />
      <Text style={styles.signName}>{name}</Text>
      <Text style={styles.signRole}>{role}</Text>
    </View>
  );
}

export function PromissoryNotePdf({ draft, logoSrc }: { draft: DocumentDraft; logoSrc?: string | null }) {
  const item = draft.installments[0];
  const amountLabel = item?.amountLabel ?? draft.amountLabel;
  const amountWords = item?.amountWords ?? draft.amountWords;
  const dueShort = item?.dueDateLabel ?? "não informado";
  const dueLong = item?.dueDateLong ?? "";
  const money = amountWords ? `${amountLabel} (${amountWords})` : amountLabel;
  const reference = draft.reference.trim();
  const vehicle = draft.vehicle;
  const hasVehicle = vehicle.brandModel !== "não informado";
  const vehicleText = hasVehicle
    ? `, referente ao veículo ${vehicle.brandModel}, ano ${vehicle.year}, cor ${vehicle.color}, placa ${vehicle.licensePlate}`
    : "";
  const referenceText = reference ? ` (${reference})` : "";

  return (
    <PdfShell title="Nota promissória" logoSrc={logoSrc}>
      <View style={local.headline} wrap={false}>
        <View style={local.headCell}>
          <Text style={local.headLabel}>NÚMERO</Text>
          <Text style={local.headValue}>{item?.label ?? "1/1"}</Text>
        </View>
        <View style={local.headCell}>
          <Text style={local.headLabel}>VENCIMENTO</Text>
          <Text style={local.headValue}>{dueShort}</Text>
        </View>
        <View style={local.headCellLast}>
          <Text style={local.headLabel}>VALOR</Text>
          <Text style={local.headAmount}>{amountLabel}</Text>
        </View>
      </View>

      <Text style={local.promise} hyphenationCallback={keepWord}>
        {`${item ? `No dia ${dueLong}` : "No vencimento"}, pagarei por esta única via de NOTA PROMISSÓRIA a ${STORE.legalName}, inscrita no CNPJ sob o nº ${STORE.cnpj}, ou à sua ordem, a quantia de ${money}, em moeda corrente nacional, pagável em ${STORE.cityLine}.`}
      </Text>

      <Parties
        leftTitle="Credor (beneficiário)"
        leftLines={[STORE.legalName, `CNPJ ${STORE.cnpj}`, STORE.cityLine]}
        rightTitle="Emitente (devedor)"
        rightLines={[draft.party.name, draft.party.document, draft.party.phone, draft.party.address]}
      />

      {/* Sem quilometragem: a promissória só identifica o bem de referência (cabe numa folha). */}
      {hasVehicle ? <Specs rows={vehicleRows(vehicle).filter((row) => row.label !== "Quilometragem")} /> : null}

      <Clause index={1} title="Da confissão de dívida">
        {`O EMITENTE reconhece e confessa dever ao CREDOR a quantia de ${money}${vehicleText}${referenceText}, dívida líquida, certa e exigível no vencimento acima.`}
      </Clause>
      <Clause index={2} title="Do pagamento">
        O pagamento será feito ao CREDOR, que dará quitação por escrito; sem ela, a dívida não se considera paga.
      </Clause>
      <Clause index={3} title="Do inadimplemento">
        Não paga no vencimento, esta nota poderá ser levada a protesto e cobrada judicialmente, nos termos da legislação cambial (Decreto nº 2.044/1908 e Lei Uniforme, Decreto nº 57.663/1966).
      </Clause>
      <Clause index={4} title="Do foro">
        {`Fica eleito o foro da Comarca de ${STORE.city}, Estado de ${STORE.stateName}.`}
      </Clause>

      <Text style={styles.closing} hyphenationCallback={keepWord}>
        {`Emitida em ${STORE.cityLine}, em ${draft.dateLabel}.`}
      </Text>

      <View style={styles.signRow} wrap={false}>
        <SignBlock name={draft.party.name} role="Emitente (devedor)" />
        <View style={styles.signGap} />
        <SignBlock name={STORE.legalName} role="Credor" />
      </View>
      <View style={styles.signRow} wrap={false}>
        <SignBlock name="Testemunha" role="Nome e CPF" />
        <View style={styles.signGap} />
        <SignBlock name="Testemunha" role="Nome e CPF" />
      </View>
    </PdfShell>
  );
}
