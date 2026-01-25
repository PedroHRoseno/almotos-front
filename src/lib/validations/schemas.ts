import { z } from "zod";

/** Schema de validação para cadastro de Veículo (API /api/vehicles) */
export const veiculoSchema = z.object({
  licensePlate: z
    .string()
    .min(1, "Placa é obrigatória")
    .max(20, "Placa deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9-]+$/i, "Placa inválida"),
  brand: z
    .string()
    .min(1, "Marca é obrigatória")
    .max(80, "Marca deve ter no máximo 80 caracteres"),
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

/** Schema de validação para registro de Venda */
export const vendaSchema = z.object({
  veiculoLicensePlate: z
    .string()
    .min(1, "Selecione um veículo"),
  clienteNome: z
    .string()
    .min(1, "Nome do cliente é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  valorVenda: z
    .number({ invalid_type_error: "Valor da venda deve ser um número" })
    .min(0.01, "Valor da venda deve ser maior que zero"),
  dataVenda: z
    .string()
    .min(1, "Data da venda é obrigatória")
    .refine((val) => !Number.isNaN(Date.parse(val)), "Data inválida"),
});

export type VendaFormData = z.infer<typeof vendaSchema>;

/** Schema de validação para Troca */
export const trocaSchema = z
  .object({
    veiculoEntradaLicensePlate: z
      .string()
      .min(1, "Selecione o veículo de entrada"),
    veiculoSaidaLicensePlate: z
      .string()
      .min(1, "Selecione o veículo de saída"),
    valorDiferenca: z
      .number({ invalid_type_error: "Valor da diferença deve ser um número" })
      .min(0, "Valor da diferença não pode ser negativo"),
  })
  .refine(
    (data) => data.veiculoEntradaLicensePlate !== data.veiculoSaidaLicensePlate,
    {
      message: "Veículo de entrada e saída devem ser diferentes",
      path: ["veiculoSaidaLicensePlate"],
    }
  );

export type TrocaFormData = z.infer<typeof trocaSchema>;
