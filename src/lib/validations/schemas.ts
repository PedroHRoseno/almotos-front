import { z } from "zod";

const PLATE_PATTERN = /^[A-Z]{3}-[0-9][A-Z0-9][0-9]{2}$/;

/** Chassi (VIN): 17 letras/números, sem I, O ou Q. */
export const CHASSIS_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export function normalizeChassis(value?: string | null): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function normalizeRenavam(value?: string | null): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 11 ? digits.padStart(11, "0") : digits;
}

/** Dígito verificador do RENAVAM (mesma regra do backend). */
export function renavamValido(value?: string | null): boolean {
  const digits = normalizeRenavam(value);
  if (!/^\d{11}$/.test(digits)) return false;
  const pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma = pesos.reduce((acc, peso, i) => acc + Number(digits[i]) * peso, 0);
  const dv = (soma * 10) % 11;
  return (dv === 10 ? 0 : dv) === Number(digits[10]);
}

const fiscalVehicleFields = {
  chassis: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || CHASSIS_PATTERN.test(normalizeChassis(value)), "Chassi: 17 letras/números, sem I, O ou Q"),
  renavam: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || renavamValido(value), "RENAVAM inválido (o dígito verificador não confere)"),
  engineCc: z
    .number({ invalid_type_error: "Cilindrada deve ser um número" })
    .int("Cilindrada deve ser inteira")
    .min(1, "Cilindrada inválida")
    .max(3000, "Cilindrada inválida")
    .optional()
    .nullable(),
  fuelType: z.enum(["GASOLINA", "ETANOL", "FLEX", "ELETRICO"]).optional().nullable(),
  ncmCode: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || /^\d{8}$/.test(value.replace(/\D/g, "")), "NCM deve ter 8 dígitos"),
};

/** Schema de validação para cadastro de Veículo (POST /vehicles). Placa vazia vale para elétrica. */
export const veiculoSchema = z.object({
  licensePlate: z.string().optional().or(z.literal("")).nullable(),
  brand: z
    .string()
    .trim()
    .min(1, "Marca é obrigatória")
    .max(64, "Marca deve ter no máximo 64 caracteres"),
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
    .int("Quilometragem deve ser um número inteiro")
    .min(0, "Quilometragem não pode ser negativa"),
  inStock: z.boolean(),
  published: z.boolean().default(false),
  description: z.string().max(2000, "Descrição deve ter no máximo 2000 caracteres").optional().or(z.literal("")),
  codigoFipe: z.string().max(16).optional().nullable(),
  suggestedPrice: z
    .number({ invalid_type_error: "Preço sugerido deve ser um número" })
    .min(0, "Preço sugerido não pode ser negativo")
    .optional()
    .nullable(),
  internalTags: z.array(z.string().min(1).max(80)).default([]),
  publicTags: z.array(z.string().min(1).max(80)).default([]),
  ownershipKind: z.enum(["OWN", "THIRD_PARTY"]).default("OWN"),
  ownerId: z.string().optional().or(z.literal("")),
  baseCost: z.number().min(0, "Custo base não pode ser negativo").optional(),
  agreedPayout: z.number().min(0, "Repasse combinado não pode ser negativo").optional(),
  ...fiscalVehicleFields,
}).superRefine((data, ctx) => {
  const plate = data.licensePlate?.trim() ?? "";
  if (plate && !PLATE_PATTERN.test(plate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["licensePlate"],
      message:
        "Placa no formato LLL-XXXX: 3 letras, hífen, 1 número, 1 letra ou número, 2 números (ex.: ABC-1B23)",
    });
  }
  if (data.ownershipKind === "THIRD_PARTY" && !data.ownerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ownerId"],
      message: "Selecione o contato dono da moto",
    });
  }
  if (data.ownershipKind === "THIRD_PARTY" && (data.agreedPayout == null || data.agreedPayout < 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["agreedPayout"],
      message: "Informe o valor de repasse combinado",
    });
  }
  if (data.ownershipKind === "OWN" && data.inStock && (data.baseCost == null || data.baseCost < 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["baseCost"],
      message: "Informe o custo base do veículo",
    });
  }
});

export type VeiculoFormData = z.infer<typeof veiculoSchema>;

/** Schema de validação para registro de Venda (POST /sales). Back-end usa vehicle.licensePlate, customer.id, salePrice. */
export const vendaSchema = z.object({
  vehicleLicensePlate: z.string().min(1, "Selecione um veículo"),
  customerId: z.string().min(1, "Selecione um contato (comprador)"),
  salePrice: z
    .number({ invalid_type_error: "Valor da venda deve ser um número" })
    .min(0.01, "Valor da venda deve ser maior que zero"),
  ownershipKind: z.enum(["OWN", "THIRD_PARTY"]).optional(),
  payoutId: z.string().optional().or(z.literal("")),
  payoutAmount: z.number().optional(),
  /** Código tPag (NF-e). Opcional na venda; a nota pede se faltar. */
  paymentMethod: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.ownershipKind !== "THIRD_PARTY") return;
  if (!data.payoutId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payoutId"],
      message: "Selecione quem recebe o repasse",
    });
  }
  if (data.payoutAmount == null || data.payoutAmount < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payoutAmount"],
      message: "Informe o valor repassado (pode ser zero)",
    });
  }
});

export type VendaFormData = z.infer<typeof vendaSchema>;

/** Schema de validação para Troca */
export const trocaSchema = z
  .object({
    veiculoEntradaLicensePlate: z.string().optional().or(z.literal("")),
    veiculoSaidaLicensePlate: z.string().min(1, "Selecione o veículo de saída"),
    salePriceLoja: z
      .number({ invalid_type_error: "Informe o preço da moto da loja" })
      .min(0, "Preço da moto da loja não pode ser negativo"),
    tradeInEvaluation: z
      .number({ invalid_type_error: "Informe a avaliação da moto do cliente" })
      .min(0, "Avaliação não pode ser negativa"),
    customerId: z
      .string()
      .min(1, "Selecione o contato do cliente nesta troca")
      .refine((value) => value !== "__NONE__", "Selecione o contato do cliente nesta troca"),
    paymentMethod: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (!data.veiculoEntradaLicensePlate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["veiculoEntradaLicensePlate"],
        message: "Selecione ou cadastre a moto que entra",
      });
    }
    if (
      data.veiculoEntradaLicensePlate &&
      data.veiculoEntradaLicensePlate === data.veiculoSaidaLicensePlate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["veiculoSaidaLicensePlate"],
        message: "Veículo de entrada e saída devem ser diferentes",
      });
    }
  });

export type TrocaFormData = z.infer<typeof trocaSchema>;

/** Schema de validação para Compra (Purchase) — veículo sempre via seletor ou botão + */
export const compraSchema = z.object({
  vehicleLicensePlate: z
    .string()
    .min(1, "Selecione ou cadastre um veículo"),
  customerId: z.string().min(1, "Selecione ou cadastre um parceiro/fornecedor"),
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
  neighborhood: z.string().max(120, "Bairro deve ter no máximo 120 caracteres").optional().or(z.literal("")),
  complement: z.string().max(120, "Complemento deve ter no máximo 120 caracteres").optional().or(z.literal("")),
  ibgeCode: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^\d{7}$/.test(value), "Código IBGE tem 7 dígitos (vem do CEP)"),
});

export const parceiroSchema = z.object({
  document: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((s) => {
      if (!s || !s.trim()) return true;
      const d = s.replace(/\D/g, "");
      return d.length === 11 || d.length === 14;
    }, "Informe CPF (11 dígitos) ou CNPJ (14 dígitos), ou deixe em branco"),
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
  email: z.string().email("E-mail inválido").max(120).optional().or(z.literal("")),
  stateRegistration: z
    .string()
    .max(20, "Inscrição estadual deve ter no máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
});

export type ParceiroFormData = z.infer<typeof parceiroSchema>;
