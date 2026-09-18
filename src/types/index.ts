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

/** Cliente/Parceiro (Customer/Partner) – id UUID; documento opcional */
export interface Customer {
  id?: string;
  document?: string | null;
  name: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  address?: Address;
}

export interface PartnerRef {
  id?: string;
  document?: string | null;
}

/** Resumo de parceiro para listagens */
export interface PartnerSummary {
  id: string;
  document?: string | null;
  name: string;
  phoneNumber1?: string;
  city?: string;
}

/** Detalhes completos do contato */
export interface PartnerDetail {
  id: string;
  document?: string | null;
  name: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  address?: Address;
  totalSales: number;
  totalPurchases: number;
  totalExchanges: number;
  ownedVehicles?: number;
  payoutSales?: number;
  totalPayout?: number;
  totalStoreProfitFromPayouts?: number;
}

export type OwnershipKind = "OWN" | "THIRD_PARTY";

export type ContactReportRole = "buyer" | "owner" | "payout" | "supplier";

/** Status do veículo – enum do back-end (VehicleStatus) */
export type VehicleStatus = "AVAILABLE" | "SOLD" | "INACTIVE" | "DISPONIVEL" | "VENDIDO";

export type AcquisitionOrigin = "PURCHASE" | "CONSIGNMENT" | "TRADE_IN" | "STOCK_ADJUSTMENT";

export type BankAccountOwner = "PEDRO" | "MAE" | "PAI" | "LOJA";

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
  | "REPASSE_PARCEIRO"
  | "RETIRADA_PEDRO"
  | "RETIRADA_MAE"
  | "RETIRADA_PAI"
  | "DESPESA_PESSOAL_FAMILIA"
  | "AJUSTE_SALDO"
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
  bankAccountId?: string | null;
  bankAccountName?: string | null;
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
  bankAccountId?: string | null;
}

/** DTO para criar transação da loja */
export interface StoreTransactionCreate {
  description: string;
  value: number;
  date?: string;
  type: TransactionTypeEnum;
  category: TransactionCategory;
  bankAccountId?: string | null;
}

/** Veículo (Vehicle) – GET /vehicles, POST /vehicles */
export interface VehicleTag {
  id: string;
  name: string;
  visibility: "INTERNAL" | "PUBLIC";
}

export interface Vehicle {
  licensePlate: string;
  brand: VehicleBrand;
  modelName: string;
  codigoFipe?: string | null;
  manufactureYear: number;
  modelYear: number;
  color: string;
  kilometersDriven: number;
  suggestedPrice?: number | null;
  status: VehicleStatus;
  inStock: boolean;
  published?: boolean;
  description?: string | null;
  imageUrlList?: string[];
  internalTags?: VehicleTag[];
  publicTags?: VehicleTag[];
  ownershipKind?: OwnershipKind;
  ownerId?: string | null;
  ownerDocument?: string | null;
  ownerName?: string | null;
  acquisitionOrigin?: AcquisitionOrigin;
  baseCost?: number;
  agreedPayout?: number | null;
}

/** Payload para criar veículo – POST /vehicles */
export interface VehicleCreate {
  licensePlate: string;
  brand: VehicleBrand;
  modelName: string;
  codigoFipe?: string | null;
  manufactureYear: number;
  modelYear: number;
  color: string;
  kilometersDriven: number;
  suggestedPrice?: number | null;
  inStock: boolean;
  published?: boolean;
  description?: string | null;
  imageUrlList?: string[];
  internalTags?: string[];
  publicTags?: string[];
  ownershipKind?: OwnershipKind;
  ownerId?: string | null;
  ownerDocument?: string | null;
  acquisitionOrigin?: AcquisitionOrigin;
  baseCost?: number | null;
  agreedPayout?: number | null;
}

export interface FipeModel {
  nome: string;
  codigoModelo: string;
}

export interface FipeModelsResponse {
  available: boolean;
  items: FipeModel[];
}

export interface FipeCodigoResponse {
  available: boolean;
  codigoFipe?: string | null;
  nome?: string | null;
}

export interface FipeAno {
  codigoAno: string;
  nome: string;
}

export interface FipeAnosResponse {
  available: boolean;
  items: FipeAno[];
}

export interface FipeConsultaResponse {
  available: boolean;
  valor?: number | null;
  valorTexto?: string | null;
  marca?: string | null;
  modelo?: string | null;
  anoModelo?: number | null;
  combustivel?: string | null;
  siglaCombustivel?: string | null;
  codigoFipe?: string | null;
  mesReferencia?: string | null;
  tipoVeiculo?: number | null;
  dataConsulta?: string | null;
}

export type InternalUserRole = "ADMIN" | "USER" | "FINANCE";

export interface InternalUser {
  id: number;
  username: string;
  role: InternalUserRole | string;
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
  partnerId?: string;
  partnerDocument?: string | null;
  partnerName: string;
  salePrice: number;
  saleDate: string;
  status: TransactionStatus;
  ownershipKind?: OwnershipKind;
  ownerId?: string | null;
  ownerDocument?: string | null;
  ownerName?: string | null;
  payoutId?: string | null;
  payoutDocument?: string | null;
  payoutName?: string | null;
  payoutAmount?: number;
  storeProfit?: number | null;
  bankAccountId?: string | null;
  baseCost?: number | null;
}

/** Payload para criar venda – POST /sales. Back-end preenche saleDate. */
export interface SaleCreate {
  vehicle: { licensePlate: string };
  customer: PartnerRef;
  salePrice: number;
  payoutPartner?: PartnerRef;
  payoutAmount?: number;
  storeProfit?: number;
  bankAccountId?: string | null;
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
  partnerId?: string;
  partnerDocument?: string | null;
  partnerName: string;
  purchasePrice: number;
  purchaseDate: string;
  status: TransactionStatus;
  bankAccountId?: string | null;
}

/** Payload para criar compra – POST /purchases */
export interface PurchaseCreate {
  vehicle: { licensePlate: string };
  customer: PartnerRef;
  purchasePrice: number;
  purchaseDate: string; // ISO format string (yyyy-MM-dd)
  bankAccountId?: string | null;
}

/** Payload para editar compra – PUT /purchases/{id} */
export interface PurchaseUpdate {
  purchasePrice?: number;
  purchaseDate?: string;
}

/** Formulário de troca */
export interface TrocaInput {
  veiculoEntradaLicensePlate?: string;
  veiculoSaidaLicensePlate: string;
  valorDiferenca?: number;
  salePriceLoja?: number;
  tradeInEvaluation?: number;
  incomingVehicle?: VehicleCreate;
  customerId?: string;
  customerDocument?: string;
  bankAccountId?: string | null;
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
  partnerId?: string;
  partnerDocument?: string | null;
  partnerName: string;
  diferencaValor: number;
  salePriceLoja?: number;
  tradeInEvaluation?: number;
  exchangeDate: string;
  status: TransactionStatus;
  bankAccountId?: string | null;
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
  lucroEstoqueProprio?: number;
  lucroTerceiros?: number;
  totalRepasses?: number;
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
  lucroEstoqueProprio?: number;
  lucroTerceiros?: number;
  totalRepasses?: number;
  receitasLoja?: number;
  custosVeiculosVendidos?: number;
  despesasOperacionais?: number;
  lucroOperacional?: number;
  retiradas?: {
    pedro: number;
    mae: number;
    pai: number;
    familia: number;
    pessoalLegado: number;
    total: number;
  };
}

export interface ContactReportSale {
  id: number;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  buyerId?: string;
  buyerDocument?: string | null;
  buyerName: string;
  ownerId?: string | null;
  ownerDocument?: string | null;
  ownerName?: string | null;
  payoutId?: string | null;
  payoutDocument?: string | null;
  payoutName?: string | null;
  salePrice: number;
  payoutAmount: number;
  storeProfit?: number | null;
  saleDate: string;
  ownershipKind: OwnershipKind;
  status: TransactionStatus;
}

export interface ContactReport {
  id?: string;
  document?: string | null;
  name: string;
  salesCount: number;
  volume: number;
  totalPayout: number;
  totalStoreProfit: number;
  ownedInStock: number;
  supplierPurchases: number;
  supplierVolume: number;
  sales: ContactReportSale[];
  totalElements: number;
  page: number;
  size: number;
}

/** Resposta paginada do Spring */
export interface BankAccount {
  id: string;
  name: string;
  ownerPerson: BankAccountOwner;
  bankName: string;
  initialBalance: number;
  isActive: boolean;
  balance: number;
}

export interface BankAccountCreate {
  name: string;
  ownerPerson: BankAccountOwner;
  bankName: string;
  initialBalance: number;
  isActive?: boolean;
}

export interface BankAccountsOverview {
  accounts: BankAccount[];
  totalsByOwner: Record<string, number>;
  unifiedBalance: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export type VehicleInterestStatus = "PENDING" | "COMPLETED" | "CANCELLED";

/** Body de POST /vehicles/interests (painel ou bot). */
export interface VehicleInterestCreate {
  phone: string;
  brand: string;
  model: string;
}

/** Lead da lista de espera – GET /vehicles/interests */
export interface VehicleInterest {
  id: string;
  contactPhone: string;
  desiredBrand: string;
  desiredModel: string;
  status: VehicleInterestStatus | string;
  createdAt: string;
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
  partnerId?: string;
  partnerDocument?: string | null;
  partnerName: string;
  status: TransactionStatus;
}

export interface SaleHistoryItem {
  id: number;
  saleDate: string;
  salePrice: number;
  partnerId?: string;
  partnerDocument?: string | null;
  partnerName: string;
  status: TransactionStatus;
  ownershipKind?: OwnershipKind;
  ownerDocument?: string | null;
  ownerName?: string | null;
  payoutDocument?: string | null;
  payoutName?: string | null;
  payoutAmount?: number;
  storeProfit?: number | null;
}

export interface ExchangeHistoryItem {
  id: number;
  exchangeDate: string;
  diferencaValor: number;
  partnerId?: string;
  partnerDocument?: string | null;
  partnerName: string;
  isIncomingVehicle: boolean; // true se este veículo é o de entrada, false se é o de saída
  status: TransactionStatus;
}
