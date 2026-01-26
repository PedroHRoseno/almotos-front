/**
 * Tipos sincronizados com as entidades/DTOs do back-end Spring Boot.
 * Controllers: VehicleController, SaleController, CustomerController, PurchaseController.
 */

/** Marca do veículo – enum do back-end (VehicleBrand) */
export type VehicleBrand =
  | "TOYOTA"
  | "HONDA"
  | "FORD"
  | "CHEVROLET"
  | "NISSAN"
  | "VOLKSWAGEN"
  | "BMW"
  | "MERCEDES_BENZ"
  | "AUDI"
  | "HYUNDAI"
  | "KIA"
  | "MAZDA"
  | "SUBARU"
  | "LEXUS"
  | "ACURA"
  | "INFINITI"
  | "PORSCHE"
  | "JAGUAR"
  | "LAND_ROVER"
  | "TESLA"
  | "VOLVO"
  | "PEUGEOT"
  | "RENAULT"
  | "CITROEN"
  | "FIAT"
  | "ALFA_ROMEO"
  | "LAMBORGHINI"
  | "FERRARI"
  | "MASERATI"
  | "YAMAHA"
  | "KAWASAKI"
  | "SUZUKI"
  | "HARLEY_DAVIDSON"
  | "BMW_MOTORRAD"
  | "DUCATI"
  | "APRILIA"
  | "TRIUMPH"
  | "KTM";

/** Lista de marcas para selects e validação */
export const VEHICLE_BRANDS: VehicleBrand[] = [
  "TOYOTA", "HONDA", "FORD", "CHEVROLET", "NISSAN", "VOLKSWAGEN", "BMW",
  "MERCEDES_BENZ", "AUDI", "HYUNDAI", "KIA", "MAZDA", "SUBARU", "LEXUS",
  "ACURA", "INFINITI", "PORSCHE", "JAGUAR", "LAND_ROVER", "TESLA", "VOLVO",
  "PEUGEOT", "RENAULT", "CITROEN", "FIAT", "ALFA_ROMEO", "LAMBORGHINI",
  "FERRARI", "MASERATI", "YAMAHA", "KAWASAKI", "SUZUKI", "HARLEY_DAVIDSON",
  "BMW_MOTORRAD", "DUCATI", "APRILIA", "TRIUMPH", "KTM",
];

/** Endereço (Address) – usado em Customer */
export interface Address {
  id?: number;
  streetName: string;
  number: string;
  city: string;
  state: string;
  reference?: string;
  zipCode: string;
}

/** Cliente/Parceiro (Customer/Partner) */
export interface Customer {
  cpf: string;
  name: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  address?: Address;
}

/** Resumo de parceiro para listagens */
export interface PartnerSummary {
  cpf: string;
  name: string;
  phoneNumber1?: string;
  city?: string;
}

/** Detalhes completos do parceiro */
export interface PartnerDetail {
  cpf: string;
  name: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  address?: Address;
  totalSales: number;
  totalPurchases: number;
  totalExchanges: number;
}

/** Status do veículo – enum do back-end (VehicleStatus) */
export type VehicleStatus = "DISPONIVEL" | "VENDIDO";

/** Veículo (Vehicle) – GET /vehicles, POST /vehicles */
export interface Vehicle {
  licensePlate: string;
  brand: VehicleBrand;
  modelName: string;
  manufactureYear: number;
  modelYear: number;
  color: string;
  kilometersDriven: number;
  status: VehicleStatus;
  inStock: boolean;
}

/** Payload para criar veículo – POST /vehicles */
export interface VehicleCreate {
  licensePlate: string;
  brand: VehicleBrand;
  modelName: string;
  manufactureYear: number;
  modelYear: number;
  color: string;
  kilometersDriven: number;
  inStock: boolean;
}

/** Venda (Sale) – GET /sales, POST /sales */
export interface Sale {
  id?: number;
  vehicle: Vehicle;
  customer: Customer;
  salePrice: number;
  saleDate?: string;
}

/** DTO de resposta de venda do backend */
export interface SaleResponse {
  id: number;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  partnerCpf: string;
  partnerName: string;
  salePrice: number;
  saleDate: string;
}

/** Payload para criar venda – POST /sales. Back-end preenche saleDate. */
export interface SaleCreate {
  vehicle: { licensePlate: string };
  customer: { cpf: string };
  salePrice: number;
}

/** DTO: veículos do cliente – GET /sales/vehicles?cpf= */
export interface CustomerOwnedVehiclesDTO {
  licensePlate: string;
  modelName: string;
}

/** DTO: vendas por marca – GET /sales/salesPerBrand */
export interface SaleBrandDTO {
  vehicleBrand: VehicleBrand;
  salesNumber: number;
}

/** Compra (Purchase) – GET /purchases, POST /purchases */
export interface Purchase {
  id?: number;
  vehicle: Vehicle;
  customer: Customer;
  purchasePrice: number;
  purchaseDate: string;
}

/** DTO de resposta de compra do backend */
export interface PurchaseResponse {
  id: number;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  partnerCpf: string;
  partnerName: string;
  purchasePrice: number;
  purchaseDate: string;
}

/** Payload para criar compra – POST /purchases */
export interface PurchaseCreate {
  vehicle: { licensePlate: string };
  customer: { cpf: string };
  purchasePrice: number;
  purchaseDate: string; // ISO format string (yyyy-MM-dd)
}

/** DTO de resposta de compra do backend */
export interface PurchaseResponse {
  id: number;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  partnerCpf: string;
  partnerName: string;
  purchasePrice: number;
  purchaseDate: string;
}

/** Payload para criar compra – POST /purchases */
export interface PurchaseCreate {
  vehicle: { licensePlate: string };
  customer: { cpf: string };
  purchasePrice: number;
  purchaseDate: string;
}

/** Formulário de troca */
export interface TrocaInput {
  veiculoEntradaLicensePlate: string;
  veiculoSaidaLicensePlate: string;
  valorDiferenca: number;
  customerCpf?: string;
}

/** DTO de resposta de troca do backend */
export interface ExchangeResponse {
  id: number;
  vehicleEntradaLicensePlate: string;
  vehicleEntradaBrand: string;
  vehicleEntradaModel: string;
  vehicleSaidaLicensePlate: string;
  vehicleSaidaBrand: string;
  vehicleSaidaModel: string;
  partnerCpf: string;
  partnerName: string;
  diferencaValor: number;
  exchangeDate: string;
}

/** DTO de Dashboard */
export interface Dashboard {
  totalVendas: number;
  totalCompras: number;
  totalTrocas: number;
  saldoLiquido: number;
  quantidadeMotosEstoque: number;
}

/** DTO de Relatório Financeiro */
export interface FinancialReport {
  saldoGeral: number;
  totalVendas: number;
  totalCompras: number;
  totalTrocas: number;
  startDate: string;
  endDate: string;
}

/** Resposta paginada do Spring */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
