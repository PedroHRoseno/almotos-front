import type {
  Vehicle,
  VehicleCreate,
  Sale,
  SaleCreate,
  SaleResponse,
  Customer,
  PartnerSummary,
  PartnerDetail,
  CustomerOwnedVehiclesDTO,
  SaleBrandDTO,
  Purchase,
  PurchaseCreate,
  PurchaseResponse,
  TrocaInput,
  ExchangeResponse,
  Dashboard,
  FinancialReport,
  PageResponse,
} from "@/types";

/** 
 * Configuração da API:
 * - Em desenvolvimento: usa proxy local (/api/proxy/*) para evitar CORS
 * - Em produção: pode usar proxy ou requisição direta (dependendo do CORS)
 */
const PROXY_PREFIX = "/api/proxy";

// Obter URL base do backend
const getBackendUrl = () => {
  // No cliente, tenta usar NEXT_PUBLIC_API_URL se disponível
  if (typeof window !== "undefined") {
    // Em produção, se NEXT_PUBLIC_API_URL estiver disponível no cliente, pode fazer requisição direta
    // Mas por segurança, vamos usar o proxy sempre
    return window.location.origin;
  }
  return "http://localhost:3000";
};

const getBaseUrl = getBackendUrl;

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

  // Debug em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log(`[API] Requisição: ${url.toString()}`);
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const status = res.status;
    const text = await res.text();
    let errorMsg = text || `${res.status} ${res.statusText}`;
    
    // Mensagem mais clara para erro 404
    if (status === 404) {
      const isProxyError = url.pathname.startsWith("/api/proxy");
      if (isProxyError) {
        errorMsg = `Backend não encontrado. Verifique se NEXT_PUBLIC_API_URL está configurado corretamente. URL tentada: ${url.toString()}`;
      }
    }
    
    console.error(`[API] Erro ${status} (${res.url}):`, errorMsg);
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
    atualizar: (id: number, body: Partial<SaleCreate> & { salePrice: number }) =>
      request<void>(`/sales/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
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
    deletar: (id: number) =>
      request<void>(`/purchases/${id}`, {
        method: "DELETE",
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
    // Compatibilidade com endpoint antigo
    listarCompat: () => request<Customer[]>("/customers/"),
    criarCompat: (body: Customer) =>
      request<void>("/customers", {
        method: "POST",
        body: JSON.stringify(body),
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
    deletar: (id: number) =>
      request<void>(`/exchanges/${id}`, {
        method: "DELETE",
      }),
  },
  /** Compatibilidade com endpoint antigo */
  trocas: {
    realizar: (body: TrocaInput) =>
      request<void>("/trocas", {
        method: "POST",
        body: JSON.stringify(body),
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
