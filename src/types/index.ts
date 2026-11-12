/**
 * Tipos sincronizados com as entidades/DTOs do back-end Spring Boot.
 * Controllers: VehicleController, SaleController, CustomerController, PurchaseController.
 */

/** Marca livre persistida no SoR. A lista é só a sugestão do cadastro. */
export type VehicleBrand = string;

/** Honda e Yamaha ficam fixas no topo; o restante são marcas de moto. */
export const MOTO_BRANDS = [
  "HONDA",
  "YAMAHA",
  "SUZUKI",
  "KAWASAKI",
  "BMW",
  "HARLEY_DAVIDSON",
  "DUCATI",
  "TRIUMPH",
  "KTM",
  "APRILIA",
  "ROYAL ENFIELD",
  "BAJAJ",
  "HAOJUE",
  "SHINERAY",
  "DAFRA",
  "AVELLOZ",
  "VOLTZ",
  "TRAXX",
  "HUSQVARNA",
  "BENELLI",
] as const;

export const PINNED_MOTO_BRANDS = ["HONDA", "YAMAHA"] as const;

/** Endereço (Address) – usado em Customer */
export interface Address {
  id?: number;
  streetName: string;
  number: string;
  city: string;
  state: string;
  reference?: string;
  zipCode: string;
  /** NF-e: bairro, complemento e código IBGE do município (preenchidos pelo CEP). */
  neighborhood?: string | null;
  complement?: string | null;
  ibgeCode?: string | null;
}

/** Cliente/Parceiro (Customer/Partner) – id UUID; documento opcional */
export interface Customer {
  id?: string;
  document?: string | null;
  name: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  address?: Address;
  email?: string | null;
  stateRegistration?: string | null;
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
  email?: string | null;
  stateRegistration?: string | null;
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

/** Status da transação – enum do back-end (TransactionStatus) */
export type TransactionStatus = "ACTIVE" | "CANCELLED";

/** Tipo de transação – ENTRY (Entrada) ou EXIT (Saída) */
export type TransactionTypeEnum = "ENTRY" | "EXIT";

/** Categoria de transação da loja */
export type TransactionCategory =
  | "VEHICLE_SALE"
  | "EXCHANGE_IN"
  | "OTHER_INFLOW"
  | "VEHICLE_PURCHASE"
  | "EXCHANGE_OUT"
  | "CONSIGNMENT_PAYOUT"
  | "STORE_EXPENSE"
  | "WITHDRAWAL";

export const MANUAL_CASH_CATEGORIES: readonly TransactionCategory[] = [
  "OTHER_INFLOW",
  "STORE_EXPENSE",
  "WITHDRAWAL",
];

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
export interface VehicleTag {
  id: string;
  name: string;
  visibility: "INTERNAL" | "PUBLIC";
}

export interface Vehicle {
  id?: string;
  licensePlate: string | null;
  brand: string;
  modelName: string;
  codigoFipe?: string | null;
  manufactureYear: number;
  modelYear: number;
  color: string;
  kilometersDriven: number;
  suggestedPrice?: number | null;
  fipeValue?: number | null;
  fipeDiscountPercentage?: number | null;
  isBelowFipe?: boolean;
  fipeSavingsAmount?: number | null;
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
  /** Identificação fiscal (NF-e). */
  chassis?: string | null;
  renavam?: string | null;
  engineCc?: number | null;
  fuelType?: FuelType | null;
  ncmCode?: string | null;
  /** NCM que a nota vai usar (manual ou pela cilindrada). */
  ncmEffective?: string;
}

export type FuelType = "GASOLINA" | "ETANOL" | "FLEX" | "ELETRICO";

/** Payload para criar veículo – POST /vehicles */
export interface VehicleCreate {
  licensePlate?: string | null;
  brand: string;
  modelName: string;
  codigoFipe?: string | null;
  manufactureYear: number;
  modelYear: number;
  color: string;
  kilometersDriven: number;
  suggestedPrice?: number | null;
  fipeValue?: number | null;
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
  chassis?: string | null;
  renavam?: string | null;
  engineCc?: number | null;
  fuelType?: FuelType | null;
  ncmCode?: string | null;
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

export type FipeVehicleKind = "motos" | "carros" | "caminhoes";

/** Um ano do modelo com o valor FIPE (GET /fipe/precos e plate lookup). */
export interface FipeYearPrice {
  codigoAno: string;
  nome: string;
  ano?: number | null;
  zeroKm: boolean;
  combustivel?: string | null;
  valor?: number | null;
  valorTexto?: string | null;
  codigoFipe?: string | null;
  mesReferencia?: string | null;
  plateYear: boolean;
}

export interface FipeYearPricesResponse {
  available: boolean;
  items: FipeYearPrice[];
}

/* ------------------------------------------------ Consulta por placa (Simples API) */

export type PlateBalanceStatus = "OK" | "LOW" | "EMPTY" | "UNKNOWN";

export interface PlateBalance {
  available: boolean;
  balanceCents?: number | null;
  estimatedLookups?: number | null;
  status: PlateBalanceStatus;
  lowThresholdCents: number;
  lookupPriceCents: number;
  checkedAt?: string | null;
}

export type PlateLookupOutcome =
  | "FOUND"
  | "NOT_FOUND"
  | "INVALID_PLATE"
  | "INSUFFICIENT_BALANCE"
  | "UNAVAILABLE"
  | "RATE_LIMITED"
  | "NOT_CONFIGURED"
  | "OCR_NO_PLATE"
  | "OCR_LOW_CONFIDENCE";

export interface PlateVehicle {
  brand: string;
  modelName: string;
  manufactureYear?: number | null;
  modelYear?: number | null;
  /** Hex #RRGGBB pronto para o color picker; null = cor sem equivalente. */
  color?: string | null;
  colorLabel?: string | null;
  fuelType?: string | null;
  engineCc?: number | null;
}

export interface PlateMetadata {
  fuelRaw?: string | null;
  city?: string | null;
  state?: string | null;
  vehicleType?: string | null;
  species?: string | null;
  origin?: string | null;
  isMotorcycle: boolean;
}

export interface PlateFipeSuggestion {
  available: boolean;
  /** Tabela FIPE usada (carro na placa → "carros"). */
  vehicleKind?: FipeVehicleKind;
  candidates: FipeModel[];
  autoSelect?: FipeModel | null;
  /** Melhor palpite: autoSelect ou o candidato mais parecido. */
  selected?: FipeModel | null;
  modelYear?: number | null;
  /** Valor FIPE do ano-modelo da placa para `selected`. */
  price?: FipeConsultaResponse | null;
  /** Valor FIPE dos outros anos do mesmo modelo. */
  years?: FipeYearPrice[];
}

export interface PlateOcr {
  plate: string;
  confidence: number;
  plateType?: string | null;
  detectionMethod?: string | null;
}

export interface PlateLookupResponse {
  outcome: PlateLookupOutcome;
  plate?: string | null;
  message?: string | null;
  charged: boolean;
  cached: boolean;
  vehicle?: PlateVehicle | null;
  metadata?: PlateMetadata | null;
  fipe?: PlateFipeSuggestion | null;
  ocr?: PlateOcr | null;
  balance: PlateBalance;
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
  baseCost?: number | null;
  /** Código tPag da NF-e (17 = PIX...). */
  paymentMethod?: string | null;
}

/** Payload para criar venda – POST /sales. Back-end preenche saleDate. */
export interface SaleCreate {
  vehicle: { licensePlate: string };
  customer: PartnerRef;
  salePrice: number;
  payoutPartner?: PartnerRef;
  payoutAmount?: number;
  storeProfit?: number;
  paymentMethod?: string | null;
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
}

/** Payload para criar compra – POST /purchases */
export interface PurchaseCreate {
  vehicle: { licensePlate: string };
  customer: PartnerRef;
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
  veiculoEntradaLicensePlate?: string;
  veiculoSaidaLicensePlate: string;
  valorDiferenca?: number;
  salePriceLoja?: number;
  tradeInEvaluation?: number;
  incomingVehicle?: VehicleCreate;
  customerId?: string;
  customerDocument?: string;
  /** Como o cliente pagou a diferença (tPag). */
  paymentMethod?: string | null;
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
  paymentMethod?: string | null;
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

// --- Fiscal (NF-e via ForeCast) --------------------------------------

export type FiscalEnvironment = "HOMOLOGACAO" | "PRODUCAO" | "MOCK";
export type FiscalSourceKind = "SALE" | "PURCHASE" | "EXCHANGE" | "RETURN";
export type FiscalDirection = "ENTRADA" | "SAIDA";
export type FiscalStatus =
  | "PROCESSANDO"
  | "AUTORIZADA"
  | "REJEITADA"
  | "DENEGADA"
  | "CANCELADA"
  | "ERRO";
export type FiscalDivergence = "PENDING" | "CANCELLED_AT_SEFAZ" | "RETURN_ISSUED" | "KEPT";
export type FiscalProblemArea = "vehicle" | "partner" | "operation" | "accountant" | "config" | "rule";

export interface FiscalPaymentMethod {
  code: string;
  label: string;
}

export interface FiscalStatusInfo {
  environment: FiscalEnvironment;
  configured: boolean;
  hasFiscalValue: boolean;
  emitterCnpj?: string;
  emitterUf?: string;
  webhookEnabled: boolean;
  pendingDivergences: number;
  paymentMethods: FiscalPaymentMethod[];
}

export interface FiscalCheckResult {
  ok: boolean;
  environment: FiscalEnvironment;
  company: {
    name?: string;
    active?: boolean;
    nfeHomologation?: boolean;
    nfeProduction?: boolean;
    series?: string;
  };
  certificateValidUntil?: string;
  problems: string[];
}

export interface FiscalDocument {
  id: number;
  ref: string;
  environment: FiscalEnvironment;
  currentEnvironment?: boolean;
  operation: string;
  direction: FiscalDirection;
  sourceKind: FiscalSourceKind;
  saleId?: number;
  purchaseId?: number;
  exchangeId?: number;
  referencedDocumentId?: number;
  vehicleId: string;
  partnerId: string;
  attempt: number;
  chassis: string;
  cfop: string;
  ncm: string;
  amount: number;
  counterpartName: string;
  counterpartDocument: string;
  description: string;
  status: FiscalStatus;
  number?: string;
  series?: string;
  accessKey?: string;
  protocol?: string;
  sefazStatus?: string;
  sefazMessage?: string;
  hasXml: boolean;
  hasDanfe: boolean;
  authorizedAt?: string;
  cancelUntil?: string;
  canCancel: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  divergence?: FiscalDivergence;
  divergenceReason?: string;
  divergenceOpenedAt?: string;
  divergenceResolvedAt?: string;
  divergenceResolvedBy?: string;
  createdAt: string;
  createdBy?: string;
}

export interface FiscalProblem {
  message: string;
  area: FiscalProblemArea;
}

export interface FiscalPlan {
  sourceKind: FiscalSourceKind;
  sourceId: number;
  operation: string;
  direction: FiscalDirection;
  label: string;
  nature: string;
  cfop: string;
  ncm: string;
  csosn: string;
  pisCofinsCst: string;
  amount: number;
  description: string;
  additionalInfo: string;
  payments: { method: string; label: string; amount: number }[];
  paymentMethodMissing: boolean;
  counterpart: {
    id: string;
    name: string;
    document?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    ibgeCode?: string;
  };
  vehicle: {
    id: string;
    plate?: string;
    brand: string;
    model: string;
    chassis?: string;
  };
  referencedDocumentId?: number;
  problems: FiscalProblem[];
  canEmit: boolean;
  documents: FiscalDocument[];
}

export interface FiscalPreview {
  environment: FiscalEnvironment;
  sourceKind: FiscalSourceKind;
  sourceId: number;
  plans: FiscalPlan[];
}

/** Situação resumida por operação (coluna "NF-e" das listas). */
export type FiscalSummary = Record<
  string,
  { statuses: Partial<Record<FiscalDirection, FiscalStatus>>; divergence: boolean }
>;

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
