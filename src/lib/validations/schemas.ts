import { z } from "zod";
import { VEHICLE_BRANDS } from "@/types";

const vehicleBrandEnum = z.enum(
  VEHICLE_BRANDS as unknown as [string, ...string[]]
);

/** Schema de validação para cadastro de Veículo (POST /vehicles). Formato LLL-XXXX: tradicional (AAA-9999) ou Mercosul (AAA-1A11). */
export const veiculoSchema = z.object({
  licensePlate: z
    .string()
    .min(1, "Placa é obrigatória")
    .length(8, "Placa deve ter 8 caracteres (ex.: KIU-1437 ou ABC-1B23)")
    .regex(/^[A-Z]{3}-[0-9][A-Z0-9][0-9]{2}$/, "Placa no formato LLL-XXXX: 3 letras, hífen, 1 número, 1 letra ou número, 2 números (ex.: KIU-1437 ou ABC-1B23)"),
  brand: vehicleBrandEnum,
  modelName: z
    .string()
    .min(1, "Modelo é obrigatório")
    .max(100, "Modelo deve ter no máximo 100 caracteres"),
  manufactureYear: z
    .number({ invalid_type_error: "Ano de fabricação deve ser um número" })
    .int("Ano deve ser inteiro")
    .min(1900, "Ano inválido")
    .max(new Date().getFullYear() + 1, "Ano não pode ser futuro"),
  modelYear: z
    .number({ invalid_type_error: "Ano do modelo deve ser um número" })
    .int("Ano deve ser inteiro")
    .min(1900, "Ano inválido")
    .max(new Date().getFullYear() + 1, "Ano não pode ser futuro"),
  color: z
    .string()
    .min(1, "Cor é obrigatória")
    .regex(/^#[0-9A-Fa-f]{6}$/, "Informe uma cor em hexadecimal (ex.: #ff0000)"),
  kilometersDriven: z
    .number({ invalid_type_error: "Quilometragem deve ser um número" })
    .min(0, "Quilometragem não pode ser negativa"),
  inStock: z.boolean(),
});

export type VeiculoFormData = z.infer<typeof veiculoSchema>;

/** Schema de validação para registro de Venda (POST /sales). Back-end usa vehicle.licensePlate, customer.document, salePrice. */
export const vendaSchema = z.object({
  vehicleLicensePlate: z.string().min(1, "Selecione um veículo"),
  customerDocument: z
    .string()
    .min(1, "Selecione um cliente/parceiro")
    .refine((s) => {
      const d = s.replace(/\D/g, "");
      return d.length === 11 || d.length === 14;
    }, "Documento inválido – informe CPF (11 dígitos) ou CNPJ (14 dígitos)"),
  salePrice: z
    .number({ invalid_type_error: "Valor da venda deve ser um número" })
    .min(0.01, "Valor da venda deve ser maior que zero"),
});

export type VendaFormData = z.infer<typeof vendaSchema>;

/** Tipo de diferença na troca: quem paga a diferença em dinheiro */
export const tipoDiferencaTrocaEnum = z.enum(["cliente_paga", "loja_paga"]);

/** Schema de validação para Troca */
export const trocaSchema = z
  .object({
    veiculoEntradaLicensePlate: z
      .string()
      .min(1, "Selecione o veículo de entrada"),
    veiculoSaidaLicensePlate: z
      .string()
      .min(1, "Selecione o veículo de saída"),
    /** Quem paga a diferença: cliente = entrada para loja (positivo), loja = saída (negativo) */
    tipoDiferenca: tipoDiferencaTrocaEnum.default("cliente_paga"),
    /** Valor absoluto em R$ (sempre >= 0). O sinal é definido por tipoDiferenca. */
    valorAbsoluto: z
      .number({ invalid_type_error: "Informe o valor em R$" })
      .min(0.01, "Informe o valor da diferença (mín. R$ 0,01)"),
    customerDocument: z
      .string()
      .optional()
      .refine(
        (doc) => {
          if (!doc || doc.trim() === "") return true;
          const d = doc.replace(/\D/g, "");
          return d.length === 11 || d.length === 14;
        },
        { message: "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos" }
      ),
  })
  .refine(
    (data) => data.veiculoEntradaLicensePlate !== data.veiculoSaidaLicensePlate,
    {
      message: "Veículo de entrada e saída devem ser diferentes",
      path: ["veiculoSaidaLicensePlate"],
    }
  );

export type TrocaFormData = z.infer<typeof trocaSchema>;

/** Schema de validação para Compra (Purchase) — veículo sempre via seletor ou botão + */
export const compraSchema = z.object({
  vehicleLicensePlate: z
    .string()
    .min(1, "Selecione ou cadastre um veículo"),
  customerDocument: z
    .string()
    .min(1, "Selecione ou cadastre um parceiro/fornecedor")
    .refine(
      (doc) => {
        const d = doc.replace(/\D/g, "");
        return d.length === 11 || d.length === 14;
      },
      { message: "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos" }
    ),
  purchasePrice: z
    .number({ invalid_type_error: "Valor da compra deve ser um número" })
    .min(0.01, "Valor da compra deve ser maior que zero"),
  purchaseDate: z
    .string()
    .min(1, "Data da compra é obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
});

export type CompraFormData = z.infer<typeof compraSchema>;

/** Schema de validação para cadastro de Parceiro (POST /partners) */
const addressSchema = z.object({
  streetName: z.string().max(200, "Rua deve ter no máximo 200 caracteres").optional().or(z.literal("")),
  number: z.string().min(1, "Número é obrigatório").max(20, "Número deve ter no máximo 20 caracteres"),
  city: z.string().min(1, "Cidade é obrigatória").max(100, "Cidade deve ter no máximo 100 caracteres"),
  state: z.string().min(2, "Estado é obrigatório").max(2, "Estado deve ter 2 caracteres (UF)"),
  reference: z.string().max(200, "Referência deve ter no máximo 200 caracteres").optional().or(z.literal("")),
  zipCode: z
    .string()
    .min(1, "CEP é obrigatório")
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido (formato: 12345-678 ou 12345678)"),
});

export const parceiroSchema = z.object({
  document: z
    .string()
    .min(1, "Documento (CPF/CNPJ) é obrigatório")
    .refine((s) => {
      const d = s.replace(/\D/g, "");
      return d.length === 11 || d.length === 14;
    }, "Informe CPF (11 dígitos) ou CNPJ (14 dígitos)"),
  name: z.string().min(1, "Nome é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres"),
  phoneNumber1: z
    .string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .regex(/^[\d\s()+-]*$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
  phoneNumber2: z
    .string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .regex(/^[\d\s()+-]*$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
  address: addressSchema.optional(),
});

export type ParceiroFormData = z.infer<typeof parceiroSchema>;
