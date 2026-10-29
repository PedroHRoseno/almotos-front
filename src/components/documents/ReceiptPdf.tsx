"use client";

import { Text, View } from "@react-pdf/renderer";
import { STORE } from "@/lib/documents";
import type { DocumentDraft } from "./types";
import { Parties, PdfShell, Specs, styles, vehicleRows } from "./pdf-theme";

function moneyLine(draft: DocumentDraft): string {
  if (!draft.amountWords) return draft.amountLabel;
  return `${draft.amountLabel} (${draft.amountWords})`;
}

export function ReceiptPdf({ draft }: { draft: DocumentDraft }) {
  const plateToken = draft.vehicle.licensePlate.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const plate = /^[A-Z0-9]{5,8}$/.test(plateToken) ? plateToken : "MOTO";
  const receiptNo = `REC-${plate}-${draft.dateIso.replace(/-/g, "")}`;
  const body = `Recebemos de ${draft.party.name}, ${draft.party.document}, a importância de ${moneyLine(draft)}, a título de pagamento ou sinal referente ao veículo ${draft.vehicle.brandModel}, ano ${draft.vehicle.year}, cor ${draft.vehicle.color}, placa ${draft.vehicle.licensePlate}. Forma de pagamento: ${draft.paymentMethod}. Para clareza, firmamos o presente recibo em ${STORE.cityLine}, em ${draft.dateLabel}.`;

  return (
    <PdfShell title="Recibo de pagamento">
      <Text style={styles.meta}>{`Nº ${receiptNo}`}</Text>
      <Text style={styles.amountLabel}>VALOR</Text>
      <Text style={styles.amountValue}>{draft.amountLabel}</Text>
      {draft.amountWords ? <Text style={styles.amountWords}>{draft.amountWords}</Text> : null}

      <Parties
        leftTitle="Recebedor"
        leftLines={[STORE.legalName, `CNPJ ${STORE.cnpj}`, STORE.cityLine]}
        rightTitle="Pagador"
        rightLines={[draft.party.name, draft.party.document, draft.party.phone, draft.party.address]}
      />

      <Specs rows={vehicleRows(draft.vehicle)} />

      <Text style={styles.intro} hyphenationCallback={(word) => [word]}>
        {body}
      </Text>

      <View style={{ width: "55%", marginLeft: "auto" }} wrap={false}>
        <View style={styles.signLine} />
        <Text style={styles.signName}>{STORE.legalName}</Text>
        <Text style={styles.signRole}>{`CNPJ ${STORE.cnpj}`}</Text>
      </View>

      <Text style={styles.stubLabel}>- - - destaque aqui - - -</Text>
      <View style={styles.stub} wrap={false}>
        <Text style={styles.stubTitle}>Comprovante do pagador</Text>
        <Text style={styles.partyLine}>{`Nº ${receiptNo}`}</Text>
        <Text style={styles.partyLine}>{`Valor: ${moneyLine(draft)}`}</Text>
        <Text style={styles.partyLine}>{`Pagador: ${draft.party.name}`}</Text>
        <Text style={styles.partyLine}>
          {`Veículo: ${draft.vehicle.brandModel} · placa ${draft.vehicle.licensePlate}`}
        </Text>
        <Text style={styles.partyLine}>{`Pagamento: ${draft.paymentMethod}`}</Text>
        <Text style={styles.partyLine}>{`${STORE.cityLine}, ${draft.dateLabel}`}</Text>
        <View style={{ width: "70%" }}>
          <View style={styles.signLine} />
          <Text style={styles.signRole}>{STORE.tradeName}</Text>
        </View>
      </View>
    </PdfShell>
  );
}
