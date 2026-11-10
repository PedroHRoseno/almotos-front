/** Chave da ficha: placa quando existe, senão o id (moto elétrica sem placa). */
export function vehicleKey(vehicle: {
  id?: string | null;
  licensePlate?: string | null;
}): string {
  const plate = vehicle.licensePlate?.trim();
  return plate || vehicle.id || "";
}

export function plateLabel(plate?: string | null): string {
  const text = plate?.trim();
  return text || "Sem placa";
}
