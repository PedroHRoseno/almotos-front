import type {
  Vehicle,
  VehicleCreate,
  Sale,
  SaleCreate,
  SaleResponse,
  SaleUpdate,
  Customer,
  PartnerSummary,
  PartnerDetail,
  CustomerOwnedVehiclesDTO,
  SaleBrandDTO,
  Purchase,
  PurchaseCreate,
  PurchaseResponse,
  PurchaseUpdate,
  TrocaInput,
  ExchangeResponse,
  ExchangeUpdate,
  Dashboard,
  FinancialReport,
  PageResponse,
  VehicleHistory,
  VehicleCostItem,
  FinancialMovement,
  StoreTransaction,
  StoreTransactionCreate,
} from "@/types";

/** Proxy local (/api/proxy/*) evita CORS; rewrites encaminham para o back-end. */
const PROXY_PREFIX = "/api/proxy";
const getBaseUrl = () =>
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

type RequestConfig = RequestInit & { params?: Record<string, string> };

async function request<T>(
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...init } = config;
  const base = getBaseUrl();
  const url = new URL(`${PROXY_PREFIX}${path}`, base);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  
  // Adicionar token de autenticação se existir
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(url.toString(), {
    ...init,
    headers,
  });

  if (!res.ok) {
    const status = res.status;
    const text = await res.text();
    const errorMsg = text || `${res.status} ${res.statusText}`;
    console.error(`[API] Erro ${status} (${res.url}):`, errorMsg);
    
    // Se for erro 401 (não autorizado), limpar token e redirecionar para login
    if (status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
    
    throw new Error(errorMsg || `Erro ${status}: ${res.statusText}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/** Helper para construir parâmetros de paginação */
function buildPaginationParams(page: number = 0, size: number = 20, sort?: string): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    size: String(size),
  };
  if (sort) {
    params.sort = sort;
  }
  return params;
}

export const api = {
  vehicles: {
    listar: (page: number = 0, size: number = 20) =>
      request<PageResponse<Vehicle>>("/vehicles", {
        params: buildPaginationParams(page, size, "licensePlate"),
      }),
    listarDisponiveis: (page: number = 0, size: number = 20) =>
      request<PageResponse<Vehicle>>("/vehicles/available", {
        params: buildPaginationParams(page, size, "licensePlate"),
      }),
    buscarPorPlaca: (licensePlate: string) =>
      request<Vehicle>("/vehicles/search", { params: { licensePlate } }),
    historico: (licensePlate: string) =>
      request<VehicleHistory>(`/vehicles/${encodeURIComponent(licensePlate)}/history`),
    criar: (body: VehicleCreate) =>
      request<void>("/vehicles", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    atualizar: (body: VehicleCreate) =>
      request<void>("/vehicles", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    deletar: (licensePlate: string) =>
      request<void>(`/vehicles/${encodeURIComponent(licensePlate)}`, {
        method: "DELETE",
      }),
    custos: {
      listar: (licensePlate: string) =>
        request<VehicleCostItem[]>(`/vehicles/${encodeURIComponent(licensePlate)}/costs`),
      criar: (licensePlate: string, body: { cost: number; description: string; costDate?: string }) =>
        request<VehicleCostItem>(`/vehicles/${encodeURIComponent(licensePlate)}/costs`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      deletar: (licensePlate: string, id: number) =>
        request<void>(`/vehicles/${encodeURIComponent(licensePlate)}/costs/${id}`, {
          method: "DELETE",
        }),
    },
  },

  sales: {
    listar: (page: number = 0, size: number = 20, search?: string) =>
      request<PageResponse<SaleResponse>>("/sales", {
        params: {
          ...buildPaginationParams(page, size, "saleDate,desc"),
          ...(search && search.trim() ? { search: search.trim() } : {}),
        },
      }),
    buscarPorId: (id: number) =>
      request<Sale>("/sales/search", { params: { id: String(id) } }),
    veiculosDoCliente: (cpf: string) =>
      request<CustomerOwnedVehiclesDTO[]>("/sales/vehicles", {
        params: { cpf },
      }),
    vendasPorMarca: () =>
      request<SaleBrandDTO[]>("/sales/salesPerBrand"),
    lucroTotal: (startDate: string, endDate: string) =>
      request<number>("/sales/profit", {
        params: { startDate, endDate },
      }),
    criar: (body: SaleCreate) =>
      request<void>("/sales", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    atualizar: (id: number, body: SaleUpdate) =>
      request<SaleResponse>(`/sales/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    cancelar: (id: number) =>
      request<SaleResponse>(`/sales/${id}/cancel`, {
        method: "POST",
      }),
    deletar: (id: number) =>
      request<void>(`/sales/${id}`, {
        method: "DELETE",
      }),
  },

  purchases: {
    listar: (page: number = 0, size: number = 20, search?: string) =>
      request<PageResponse<PurchaseResponse>>("/purchases", {
        params: {
          ...buildPaginationParams(page, size, "purchaseDate,desc"),
          ...(search && search.trim() ? { search: search.trim() } : {}),
        },
      }),
    criar: (body: PurchaseCreate) =>
      request<void>("/purchases", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    atualizar: (id: number, body: PurchaseUpdate) =>
      request<PurchaseResponse>(`/purchases/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    cancelar: (id: number) =>
      request<PurchaseResponse>(`/purchases/${id}/cancel`, {
        method: "POST",
      }),
    deletar: (id: number, deleteVehicle: boolean = false) =>
      request<void>(`/purchases/${id}`, {
        method: "DELETE",
        params: { deleteVehicle: String(deleteVehicle) },
      }),
  },

  customers: {
    listar: (page: number = 0, size: number = 20, search?: string) =>
      request<PageResponse<PartnerSummary>>("/partners", {
        params: {
          ...buildPaginationParams(page, size, "name"),
          ...(search && search.trim() ? { search: search.trim() } : {}),
        },
      }),
    buscarPorCpf: (cpf: string) =>
      request<PartnerDetail>(`/partners/${encodeURIComponent(cpf)}`),
    criar: (body: Customer) =>
      request<void>("/partners", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    atualizar: (cpf: string, body: Customer) =>
      request<void>(`/partners/${encodeURIComponent(cpf)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    deletar: (cpf: string) =>
      request<void>(`/partners/${encodeURIComponent(cpf)}`, {
        method: "DELETE",
      }),
  },

  exchanges: {
    listar: (page: number = 0, size: number = 20) =>
      request<PageResponse<ExchangeResponse>>("/exchanges", {
        params: buildPaginationParams(page, size, "exchangeDate,desc"),
      }),
    realizar: (body: TrocaInput) =>
      request<void>("/exchanges", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    atualizar: (id: number, body: ExchangeUpdate) =>
      request<ExchangeResponse>(`/exchanges/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    cancelar: (id: number) =>
      request<ExchangeResponse>(`/exchanges/${id}/cancel`, {
        method: "POST",
      }),
    deletar: (id: number, deleteIncomingVehicle: boolean = false) =>
      request<void>(`/exchanges/${id}`, {
        method: "DELETE",
        params: { deleteIncomingVehicle: String(deleteIncomingVehicle) },
      }),
  },

  reports: {
    dashboard: () => request<Dashboard>("/reports/dashboard"),
    financial: (startDate?: string, endDate?: string) => {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      return request<FinancialReport>("/reports/financial", { params });
    },
  },
  financial: {
    movements: (page: number = 0, size: number = 20, startDate?: string, endDate?: string, type?: "ENTRY" | "EXIT", category?: string) => {
      const params: Record<string, string> = {
        page: String(page),
        size: String(size),
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (type) params.type = type;
      if (category) params.category = category;
      return request<PageResponse<FinancialMovement>>("/financial/movements", { params });
    },
  },
  storeTransactions: {
    listar: (page: number = 0, size: number = 20) =>
      request<PageResponse<StoreTransaction>>("/store-transactions", {
        params: buildPaginationParams(page, size, "date,desc"),
      }),
    criar: (body: StoreTransactionCreate) =>
      request<StoreTransaction>("/store-transactions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    atualizar: (id: number, body: Partial<StoreTransactionCreate>) =>
      request<StoreTransaction>(`/store-transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    cancelar: (id: number) =>
      request<StoreTransaction>(`/store-transactions/${id}/cancel`, {
        method: "POST",
      }),
    deletar: (id: number) =>
      request<void>(`/store-transactions/${id}`, {
        method: "DELETE",
      }),
  },
};

export type {
  Vehicle,
  VehicleCreate,
  Sale,
  SaleCreate,
  Customer,
  Purchase,
  PurchaseCreate,
  Dashboard,
  FinancialReport,
};
