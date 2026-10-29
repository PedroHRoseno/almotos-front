"use client";

import { Text, View } from "@react-pdf/renderer";
import { STORE } from "@/lib/documents";
import type { DocumentDraft } from "./types";
import { Clause, Parties, PdfShell, Signatures, Specs, styles, vehicleRows } from "./pdf-theme";

function priceClause(draft: DocumentDraft): string {
  const payment = `Forma de pagamento declarada: ${draft.paymentMethod}.`;
  if (!draft.amountWords) {
    return `O preço não foi lançado neste instrumento e será o valor que as partes declararem por escrito no ato do pagamento. ${payment} Este contrato não estipula parcelas, juros ou financiamento.`;
  }
  return `O preço certo e ajustado é de ${draft.amountLabel} (${draft.amountWords}). ${payment} Este contrato não estipula parcelas, juros ou financiamento além da forma de pagamento aqui declarada.`;
}

export function SalesContractPdf({ draft }: { draft: DocumentDraft }) {
  const vehicle = draft.vehicle;
  const missingIds = [vehicle.chassis ? "" : "chassi", vehicle.renavam ? "" : "RENAVAM"].filter(Boolean);
  const idNote = missingIds.length
    ? ` ${missingIds.join(" e ")} não informado${missingIds.length > 1 ? "s" : ""} neste instrumento.`
    : "";

  return (
    <PdfShell title="Contrato de compra e venda de veículo usado">
      <Text style={styles.intro} hyphenationCallback={(word) => [word]}>
        {`Pelo presente instrumento particular, de um lado ${STORE.legalName}, inscrita no CNPJ sob o nº ${STORE.cnpj}, com atuação em ${STORE.cityLine}, doravante VENDEDORA, e, de outro lado, a pessoa qualificada abaixo, doravante COMPRADOR, têm entre si justo e contratado o seguinte.`}
      </Text>

      <Parties
        leftTitle="Vendedora"
        leftLines={[STORE.legalName, `CNPJ ${STORE.cnpj}`, STORE.cityLine]}
        rightTitle="Comprador"
        rightLines={[draft.party.name, draft.party.document, draft.party.phone, draft.party.address]}
      />

      <Specs rows={vehicleRows(vehicle)} />

      <Clause index={1} title="Do objeto">
        {`A VENDEDORA vende ao COMPRADOR, que adquire, o veículo usado identificado neste contrato (${vehicle.brandModel}, ano ${vehicle.year}, cor ${vehicle.color}, placa ${vehicle.licensePlate}, ${vehicle.kilometers}), no estado em que se encontra, sem reserva de domínio.${idNote}`}
      </Clause>
      <Clause index={2} title="Do preço e da forma de pagamento">
        {priceClause(draft)}
      </Clause>
      <Clause index={3} title="Da vistoria">
        O COMPRADOR declara que vistoriou o veículo, inclusive quanto a ano, cor, quilometragem e estado aparente, e que o recebe nessas condições.
      </Clause>
      <Clause index={4} title="Da garantia">
        Por se tratar de veículo usado, a VENDEDORA responde por vício oculto que torne o bem impróprio ao uso, pelo prazo de 90 (noventa) dias contados da entrega, quando a relação for de consumo, nos termos do art. 26, II, do Código de Defesa do Consumidor. Não integram essa garantia o desgaste natural, a quilometragem de uso, avarias aparentes já verificadas nem danos de mau uso, acidente ou alteração ocorridos depois da entrega.
      </Clause>
      <Clause index={5} title="Da entrega">
        {`A entrega e a tradição da posse ocorrem em ${STORE.cityLine}, na data deste contrato. A partir daí correm por conta do COMPRADOR os riscos da coisa, o uso, o licenciamento e a transferência do registro perante o órgão de trânsito, no prazo legal.`}
      </Clause>
      <Clause index={6} title="Dos débitos">
        A VENDEDORA declara não ter conhecimento, até a data da entrega, de ônus que impeça a venda. Multas, tributos e encargos posteriores à entrega ficam a cargo do COMPRADOR. A transferência no Detran não se opera por este contrato e depende do comprador.
      </Clause>
      <Clause index={7} title="Do foro">
        {`As partes elegem o foro da Comarca de ${STORE.city}, Estado de ${STORE.stateName}, para dirimir controvérsia oriunda deste contrato.`}
      </Clause>

      <Text style={styles.closing} hyphenationCallback={(word) => [word]}>
        {`E, por estarem de acordo, as partes assinam o presente em duas vias de igual teor, em ${STORE.cityLine}, em ${draft.dateLabel}.`}
      </Text>

      <Signatures
        leftTitle="Vendedora"
        leftName={STORE.legalName}
        rightTitle="Comprador"
        rightName={draft.party.name}
      />

      <View style={styles.signRow} wrap={false}>
        <View style={styles.signCol}>
          <View style={styles.signLine} />
          <Text style={styles.signName}>Testemunha</Text>
          <Text style={styles.signRole}>Nome e CPF</Text>
        </View>
        <View style={styles.signGap} />
        <View style={styles.signCol}>
          <View style={styles.signLine} />
          <Text style={styles.signName}>Testemunha</Text>
          <Text style={styles.signRole}>Nome e CPF</Text>
        </View>
      </View>
    </PdfShell>
  );
}
