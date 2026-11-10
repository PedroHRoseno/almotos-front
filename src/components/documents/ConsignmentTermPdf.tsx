"use client";

import { Text } from "@react-pdf/renderer";
import { STORE } from "@/lib/documents";
import type { DocumentDraft } from "./types";
import { Clause, Parties, PdfShell, Signatures, Specs, styles, vehicleRows } from "./pdf-theme";

function referenceClause(draft: DocumentDraft): string {
  if (!draft.amountWords) {
    return "Não houve valor de referência lançado neste termo. A venda a terceiro e o eventual repasse serão formalizados em instrumento próprio, com os valores que as partes declararem na ocasião. Este termo não calcula comissão nem preço de venda.";
  }
  return `As partes informam como referência comercial o valor de ${draft.amountLabel} (${draft.amountWords}). Esse número não fecha o preço de venda, não define comissão e não substitui o contrato com o futuro comprador nem o recibo de repasse. Forma relacionada a este termo: ${draft.paymentMethod}.`;
}

export function ConsignmentTermPdf({ draft, logoSrc }: { draft: DocumentDraft; logoSrc?: string | null }) {
  const vehicle = draft.vehicle;

  return (
    <PdfShell title="Termo de entrega de veículo em consignação" logoSrc={logoSrc}>
      <Text style={styles.intro} hyphenationCallback={(word) => [word]}>
        {`Pelo presente termo, o CONSIGNANTE, pessoa qualificada abaixo, entrega à CONSIGNATÁRIA ${STORE.legalName}, CNPJ ${STORE.cnpj}, em ${STORE.cityLine}, o veículo descrito a seguir, para guarda, exposição e intermediação de venda, sem transferência de propriedade.`}
      </Text>

      <Parties
        leftTitle="Consignante"
        leftLines={[draft.party.name, draft.party.document, draft.party.phone, draft.party.address]}
        rightTitle="Consignatária"
        rightLines={[STORE.legalName, `CNPJ ${STORE.cnpj}`, STORE.cityLine]}
      />

      <Specs rows={vehicleRows(vehicle)} />

      <Clause index={1} title="Do objeto">
        {`O CONSIGNANTE entrega nesta data o veículo ${vehicle.brandModel}, ano ${vehicle.year}, cor ${vehicle.color}, placa ${vehicle.licensePlate}, ${vehicle.kilometers}${vehicle.chassis ? `, chassi ${vehicle.chassis}` : ""}${vehicle.renavam ? `, RENAVAM ${vehicle.renavam}` : ""}. A entrega não importa venda nem cessão da propriedade.`}
      </Clause>
      <Clause index={2} title="Da propriedade">
        O veículo permanece de propriedade do CONSIGNANTE. A venda a terceiro, se ocorrer, será objeto de contrato próprio. Até lá, a CONSIGNATÁRIA apenas guarda e expõe o bem.
      </Clause>
      <Clause index={3} title="Do valor de referência">
        {referenceClause(draft)}
      </Clause>
      <Clause index={4} title="Da guarda">
        {`A CONSIGNATÁRIA conserva o veículo com a diligência ordinária de quem o recebe para exposição em ${STORE.cityLine}. Este termo não constitui contrato de seguro.`}
      </Clause>
      <Clause index={5} title="Da retirada">
        Enquanto não houver venda concluída, o CONSIGNANTE pode pedir a devolução e a CONSIGNATÁRIA restitui o mesmo veículo, encerrando a consignação.
      </Clause>
      <Clause index={6} title="Dos débitos e do registro">
        IPVA, multas e restrições anteriores à entrega permanecem com o CONSIGNANTE. Este termo não altera o registro de propriedade no órgão de trânsito.
      </Clause>
      <Clause index={7} title="Do foro">
        {`As partes elegem o foro da Comarca de ${STORE.city}, Estado de ${STORE.stateName}.`}
      </Clause>

      <Text style={styles.closing} hyphenationCallback={(word) => [word]}>
        {`E, por estarem de acordo, assinam o presente em duas vias de igual teor, em ${STORE.cityLine}, em ${draft.dateLabel}.`}
      </Text>

      <Signatures
        leftTitle="Consignante"
        leftName={draft.party.name}
        rightTitle="Consignatária"
        rightName={STORE.legalName}
      />
    </PdfShell>
  );
}
