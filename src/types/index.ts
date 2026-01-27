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
export type VehicleStatus = "DISPONIVEL" | "VENDIDO" | "INACTIVE";

/** Status da transação – enum do back-end (TransactionStatus) */
export type TransactionStatus = "ACTIVE" | "CANCELLED";

/** Tipo de transação – ENTRY (Entrada) ou EXIT (Saída) */
export type TransactionTypeEnum = "ENTRY" | "EXIT";

/** Categoria de transação da loja */
export type TransactionCategory =
  | "OPERACIONAL"
  | "ADMINISTRATIVO"
  | "MARKETING"
  | "INFRAESTRUTURA"
  | "PESSOAL"
  | "SERVICOS_PRESTADOS"
  | "OUTROS";

/** Origem da movimentação */
export type MovementOrigin = "VEHICLE" | "STORE";

/** Movimentação financeira unificada */
export interface FinancialMovement {
  id: number;
  date: string;
  description: string;
  value: number;
  type: TransactionTypeEnum;
  origin: MovementOrigin;
  status: TransactionStatus;
  category?: string;
  vehicleLicensePlate?: string;
  transactionType?: string;
}

/** Transação da loja */
export interface StoreTransaction {
  id: number;
  description: string;
  value: number;
  date: string;
  type: TransactionTypeEnum;
  category: TransactionCategory;
  status: TransactionStatus;
}

/** DTO para criar transação da loja */
export interface StoreTransactionCreate {
  description: string;
  value: number;
  date?: string;
  type: TransactionTypeEnum;
  category: TransactionCategory;
}

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
  status: TransactionStatus;
}

/** Payload para criar venda – POST /sales. Back-end preenche saleDate. */
export interface SaleCreate {
  vehicle: { licensePlate: string };
  customer: { cpf: string };
  salePrice: number;
}

/** Payload para editar venda – PUT /sales/{id} */
export interface SaleUpdate {
  salePrice?: number;
  saleDate?: string;
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
  status: TransactionStatus;
}

/** Payload para criar compra – POST /purchases */
export interface PurchaseCreate {
  vehicle: { licensePlate: string };
  customer: { cpf: string };
  purchasePrice: number;
  purchaseDate: string; // ISO format string (yyyy-MM-dd)
}

/** Payload para editar compra – PUT /purchases/{id} */
export interface PurchaseUpdate {
  purchasePrice?: number;
  purchaseDate?: string;
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
  status: TransactionStatus;
}

/** Payload para editar troca – PUT /exchanges/{id} */
export interface ExchangeUpdate {
  diferencaValor?: number;
  exchangeDate?: string;
}

/** DTO de Dashboard */
export interface Dashboard {
  totalVendas: number;
  totalCompras: number;
  totalTrocas: number;
  totalCustos: number;
  despesasOperacionais: number;
  lucroBruto: number;
  lucroLiquido: number;
  saldoLiquido: number;
  quantidadeMotosEstoque: number;
}

/** DTO de Relatório Financeiro */
export interface FinancialReport {
  saldoGeral: number;
  totalVendas: number;
  totalCompras: number;
  totalTrocas: number;
  totalCustos: number;
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

/** Histórico completo do veículo */
export interface VehicleHistory {
  vehicle: Vehicle;
  purchases: PurchaseHistoryItem[];
  sales: SaleHistoryItem[];
  exchanges: ExchangeHistoryItem[];
  costs: VehicleCostItem[];
  totalCosts: number;
}

export interface VehicleCostItem {
  id: number;
  vehicleLicensePlate: string;
  cost: number;
  description: string;
  costDate: string;
}

export interface PurchaseHistoryItem {
  id: number;
  purchaseDate: string;
  purchasePrice: number;
  partnerCpf: string;
  partnerName: string;
  status: TransactionStatus;
}

export interface SaleHistoryItem {
  id: number;
  saleDate: string;
  salePrice: number;
  partnerCpf: string;
  partnerName: string;
  status: TransactionStatus;
}

export interface ExchangeHistoryItem {
  id: number;
  exchangeDate: string;
  diferencaValor: number;
  partnerCpf: string;
  partnerName: string;
  isIncomingVehicle: boolean; // true se este veículo é o de entrada, false se é o de saída
  status: TransactionStatus;
}
