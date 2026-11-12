import type { VeiculoFormData } from "@/lib/validations/schemas";
import type { PlateLookupResponse } from "@/types";

const FUELS = new Set(["GASOLINA", "ETANOL", "FLEX", "ELETRICO"]);
const HEX = /^#[0-9A-Fa-f]{6}$/;

/** Campos do form de moto que a placa sabe preencher (só os que vieram). */
export function plateToVehicleValues(res: PlateLookupResponse): Partial<VeiculoFormData> {
  const v = res.vehicle;
  if (!v) return {};
  const values: Partial<VeiculoFormData> = {};
  if (res.plate) values.licensePlate = res.plate;
  if (v.brand) values.brand = v.brand;
  if (v.modelName) values.modelName = v.modelName;
  if (v.manufactureYear) values.manufactureYear = v.manufactureYear;
  if (v.modelYear) values.modelYear = v.modelYear;
  if (v.color && HEX.test(v.color)) values.color = v.color.toLowerCase();
  if (v.fuelType && FUELS.has(v.fuelType)) values.fuelType = v.fuelType as VeiculoFormData["fuelType"];
  if (v.engineCc) values.engineCc = v.engineCc;
  return values;
}

export const PLATE_FIELD_LABELS: Partial<Record<keyof VeiculoFormData, string>> = {
  brand: "Marca",
  modelName: "Modelo",
  manufactureYear: "Ano de fabricação",
  modelYear: "Ano do modelo",
  color: "Cor",
  fuelType: "Combustível",
  engineCc: "Cilindrada",
};
