import { z } from "zod";
import { VEHICLE_BRANDS } from "@/types";

const vehicleBrandEnum = z.enum(
  VEHICLE_BRANDS as unknown as [string, ...string[]]
);

/** Schema de validação para cadastro de Veículo (POST /vehicles) */
export const veiculoSchema = z.object({
  licensePlate: z
    .string()
    .min(1, "Placa é obrigatória")
    .max(20, "Placa deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9-]+$/i, "Placa inválida"),
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

/** Schema de validação para registro de Venda (POST /sales). Back-end usa vehicle.licensePlate, customer.cpf, salePrice. */
export const vendaSchema = z.object({
  vehicleLicensePlate: z.string().min(1, "Selecione um veículo"),
  customerCpf: z
    .string()
    .min(1, "Selecione um cliente/parceiro")
    .refine((s) => {
      const digitsOnly = s.replace(/\D/g, "");
      return digitsOnly.length === 11;
    }, "CPF inválido - deve ter 11 dígitos"),
  salePrice: z
    .number({ invalid_type_error: "Valor da venda deve ser um número" })
    .min(0.01, "Valor da venda deve ser maior que zero"),
});

export type VendaFormData = z.infer<typeof vendaSchema>;

/** Schema de validação para Troca (sem endpoint no back-end) */
export const trocaSchema = z
  .object({
    veiculoEntradaLicensePlate: z
      .string()
      .min(1, "Selecione o veículo de entrada"),
    veiculoSaidaLicensePlate: z
      .string()
      .min(1, "Selecione o veículo de saída"),
    valorDiferenca: z
      .number({ invalid_type_error: "Valor da diferença deve ser um número" }),
    customerCpf: z
      .string()
      .optional()
      .refine(
        (cpf) => {
          if (!cpf || cpf.trim() === "") return true; // Opcional
          const digitsOnly = cpf.replace(/\D/g, "");
          return digitsOnly.length === 11;
        },
        { message: "CPF deve ter 11 dígitos" }
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

/** Schema de validação para Compra (Purchase) */
export const compraSchema = z.object({
  vehicleLicensePlate: z
    .string()
    .min(1, "Selecione ou cadastre um veículo"),
  customerCpf: z
    .string()
    .min(1, "Selecione ou cadastre um parceiro/fornecedor")
    .refine(
      (cpf) => {
        const digitsOnly = cpf.replace(/\D/g, "");
        return digitsOnly.length === 11;
      },
      { message: "CPF deve ter 11 dígitos" }
    ),
  purchasePrice: z
    .number({ invalid_type_error: "Valor da compra deve ser um número" })
    .min(0.01, "Valor da compra deve ser maior que zero"),
  purchaseDate: z
    .string()
    .min(1, "Data da compra é obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  // Campos opcionais para cadastro de veículo
  cadastrarVeiculo: z.boolean().optional(),
  vehicleBrand: vehicleBrandEnum.optional(),
  vehicleModelName: z.string().optional(),
  vehicleManufactureYear: z.number().optional(),
  vehicleModelYear: z.number().optional(),
  vehicleColor: z.string().optional(),
  vehicleKilometersDriven: z.number().optional(),
}).refine(
  (data) => {
    // Se cadastrarVeiculo for true, os campos do veículo são obrigatórios
    if (data.cadastrarVeiculo) {
      return (
        data.vehicleBrand !== undefined &&
        data.vehicleModelName !== undefined &&
        data.vehicleModelName.trim() !== "" &&
        data.vehicleManufactureYear !== undefined &&
        data.vehicleModelYear !== undefined &&
        data.vehicleColor !== undefined &&
        data.vehicleKilometersDriven !== undefined
      );
    }
    return true;
  },
  {
    message: "Preencha todos os campos do veículo ao cadastrar novo veículo",
    path: ["vehicleModelName"],
  }
);

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
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .max(14, "CPF inválido")
    .refine((s) => s.replace(/\D/g, "").length === 11, "Informe CPF com 11 dígitos"),
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
