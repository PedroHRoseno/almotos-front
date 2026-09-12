export function isVehicleAvailable(vehicle: {
  inStock?: boolean;
  status?: string | null;
}): boolean {
  return Boolean(
    vehicle.inStock || vehicle.status === "AVAILABLE" || vehicle.status === "DISPONIVEL"
  );
}
