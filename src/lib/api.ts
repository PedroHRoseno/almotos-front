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
  ContactReport,
  ContactReportRole,
  OwnershipKind,
  PageResponse,
  VehicleHistory,
  VehicleCostItem,
  FinancialMovement,
  StoreTransaction,
  StoreTransactionCreate,
  FipeModelsResponse,
  FipeCodigoResponse,
  FipeAnosResponse,
  FipeConsultaResponse,
  FipeVehicleKind,
  FipeYearPricesResponse,
  PlateBalance,
  PlateLookupResponse,
  VehicleTag,
  InternalUser,
  VehicleInterest,
  VehicleInterestCreate,
  VehicleInterestStatus,
  FiscalCheckResult,
  FiscalDirection,
  FiscalDocument,
  FiscalPreview,
  FiscalSourceKind,
  FiscalStatusInfo,
  FiscalSummary,
  ReceivableAccount,
  ReceivableCreate,
  ReceivableFilter,
  ReceivableSummary,
} from "@/types";
import {
  clearStoredAuth,
  getValidStoredToken,
  shouldRedirectOnAuthError,
} from "@/lib/auth-token";

/** Proxy local (/api/proxy/*) evita CORS; rewrites encaminham para o back-end. */
const PROXY_PREFIX = "/api/proxy";
const getBaseUrl = () =>
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

type RequestConfig = RequestInit & { params?: Record<string, string> };

function parseApiErrorBody(text: string, status: number, statusText: string): string {
  try {
    const body = JSON.parse(text) as { error?: string; message?: string };
    if (body.error?.trim()) return body.error;
    if (body.message?.trim()) return body.message;
  } catch {
    /* corpo não é JSON */
  }
  return text || `${status} ${statusText}`;
}

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
  
  const token = typeof window !== "undefined" ? getValidStoredToken() : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (typeof window !== "undefined") {
    const rawTokenPresent = !!localStorage.getItem("auth_token");
    console.debug("[API] →", init.method || "GET", url.pathname, {
      authorizationAttached: !!token,
      tokenPresentInStorage: rawTokenPresent,
      tokenPreview: token ? `${token.slice(0, 12)}…` : null,
    });
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers,
  });

  if (!res.ok) {
    const status = res.status;
    const text = await res.text();
    const errorMsg = parseApiErrorBody(text, status, res.statusText);
    console.error(`[API] Erro ${status} (${res.url}):`, errorMsg);
    
    // Apenas 401 = sessão inválida/ausente. 403/400/500 não devem deslogar o usuário.
    if (status === 401 && shouldRedirectOnAuthError()) {
      console.error("[Auth] Sessão inválida (401). Redirecionando para /login.", {
        url: res.url,
        body: errorMsg,
      });
      clearStoredAuth();
      setTimeout(() => {
        window.location.href = "/login";
      }, 150);
    }
    
    throw new Error(errorMsg || `Erro ${status}: ${res.statusText}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

async function uploadMultipart<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PUT" | "PATCH" = "POST"
): Promise<T> {
  const base = getBaseUrl();
  const url = new URL(`${PROXY_PREFIX}${path}`, base);

  const token = typeof window !== "undefined" ? getValidStoredToken() : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // NÃO definir Content-Type aqui — o browser seta boundary automaticamente.

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: formData,
  });

  if (!res.ok) {
    const status = res.status;
    const text = await res.text();
    const errorMsg = parseApiErrorBody(text, status, res.statusText);
    console.error(`[API] Erro ${status} (${res.url}):`, errorMsg);
    throw new Error(errorMsg || `Erro ${status}: ${res.statusText}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function getProxyVehicleImageUploadUrl(): string {
  const base =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return new URL(`${PROXY_PREFIX}/api/vehicles/images/upload`, base).toString();
}

/** Upload multipart com progresso (XHR); use na fila de fotos do veículo. */
export function uploadVehicleImageWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", getProxyVehicleImageUploadUrl());
    const token = typeof window !== "undefined" ? getValidStoredToken() : null;
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText || "{}") as { url?: string };
          if (!data?.url) {
            reject(new Error("Resposta sem URL"));
            return;
          }
          resolve({ url: data.url });
        } catch {
          reject(new Error("Resposta inválida do servidor"));
        }
      } else {
        reject(new Error(xhr.responseText || `${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Falha de rede"));
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

/**
 * Baixa um arquivo autenticado (XML/DANFE). Link direto não leva o JWT, então
 * busca como blob e abre (PDF) ou salva (XML).
 */
export async function downloadAuthenticatedFile(
  path: string,
  fileName: string,
  mode: "open" | "save" = "save"
): Promise<void> {
  const url = new URL(`${PROXY_PREFIX}${path}`, getBaseUrl());
  const token = getValidStoredToken();
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorBody(text, res.status, res.statusText));
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  if (mode === "open") {
    window.open(objectUrl, "_blank", "noopener");
  } else {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/** Teto de `size` no SoR FastAPI (`PageQuery`: ge=1, le=200). Acima disso a API devolve 422. */
export const API_MAX_PAGE_SIZE = 200;

/** Helper para construir parâmetros de paginação */
function buildPaginationParams(page: number = 0, size: number = 20, sort?: string): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    size: String(Math.min(Math.max(size, 1), API_MAX_PAGE_SIZE)),
  };
  if (sort) {
    params.sort = sort;
  }
  return params;
}

export const api = {
  vehicles: {
    listar: (
      page: number = 0,
      size: number = 20,
      options?: {
        search?: string;
        inStock?: boolean;
        published?: boolean;
        ownershipKind?: OwnershipKind;
        ownerDocument?: string;
        ownerId?: string;
        sort?: string;
      }
    ) => {
      const params: Record<string, string> = {
        ...buildPaginationParams(page, size, options?.sort ?? "createdAt,desc"),
      };
      const search = options?.search?.trim();
      if (search) params.search = search;
      if (options?.inStock !== undefined) params.inStock = String(options.inStock);
      if (options?.published !== undefined) params.published = String(options.published);
      if (options?.ownershipKind) params.ownershipKind = options.ownershipKind;
      if (options?.ownerId) params.ownerId = options.ownerId;
      if (options?.ownerDocument) params.ownerDocument = options.ownerDocument;
      return request<PageResponse<Vehicle>>("/vehicles", { params });
    },
    listarDisponiveis: (page: number = 0, size: number = 20) =>
      request<PageResponse<Vehicle>>("/vehicles/available", {
        params: buildPaginationParams(page, size, "licensePlate"),
      }),
    buscarPorPlaca: (licensePlate: string) =>
      request<Vehicle>(`/vehicles/${encodeURIComponent(licensePlate)}`),
    historico: (licensePlate: string) =>
      request<VehicleHistory>(`/vehicles/${encodeURIComponent(licensePlate)}/history`),
    detalhes: (licensePlate: string) =>
      request<Vehicle>(`/vehicles/${encodeURIComponent(licensePlate)}`),
    criar: (body: VehicleCreate) =>
      request<Vehicle>("/vehicles", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    atualizar: (licensePlate: string, body: VehicleCreate) =>
      request<void>(`/vehicles/${encodeURIComponent(licensePlate)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    atualizarCatalogo: (licensePlate: string, body: { published?: boolean; imageUrlList?: string[]; description?: string | null }) =>
      request<void>(`/vehicles/${encodeURIComponent(licensePlate)}/catalog`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deletar: (licensePlate: string) =>
      request<void>(`/vehicles/${encodeURIComponent(licensePlate)}`, {
        method: "DELETE",
      }),
    devolverConsignado: (licensePlate: string) =>
      request<Vehicle>(`/vehicles/${encodeURIComponent(licensePlate)}/return-consignment`, {
        method: "POST",
      }),
    estornarCompra: (licensePlate: string) =>
      request<PurchaseResponse>(`/vehicles/${encodeURIComponent(licensePlate)}/cancel-purchase`, {
        method: "POST",
      }),
    uploadImage: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      // Endpoint do backend usa prefixo /api
      return uploadMultipart<{ url: string }>("/api/vehicles/images/upload", fd, "POST");
    },
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

  fipe: {
    models: (brand: string, q?: string, limit?: number) =>
      request<FipeModelsResponse>("/fipe/models", {
        params: {
          brand,
          ...(q?.trim() ? { q: q.trim() } : {}),
          ...(limit ? { limit: String(limit) } : {}),
        },
      }),
    codigo: (brand: string, codigoModelo: string, year?: number) =>
      request<FipeCodigoResponse>("/fipe/codigo", {
        params: {
          brand,
          codigoModelo,
          ...(year != null ? { year: String(year) } : {}),
        },
      }),
    anos: (brand: string, codigoModelo: string) =>
      request<FipeAnosResponse>("/fipe/anos", {
        params: { brand, codigoModelo },
      }),
    /** Valor de cada ano do modelo numa chamada só. */
    precos: (brand: string, codigoModelo: string, tipo: FipeVehicleKind = "motos") =>
      request<FipeYearPricesResponse>("/fipe/precos", {
        params: { brand, codigoModelo, tipo },
      }),
    consulta: (brand: string, codigoModelo: string, year: number, tipo: FipeVehicleKind = "motos") =>
      request<FipeConsultaResponse>("/fipe/consulta", {
        params: { brand, codigoModelo, year: String(year), tipo },
      }),
    /** Pelo código exato do ano FIPE ("2023-1", "32000-1" = Zero KM). */
    consultaPorCodigoAno: (brand: string, codigoModelo: string, yearCode: string) =>
      request<FipeConsultaResponse>("/fipe/consulta", {
        params: { brand, codigoModelo, yearCode },
      }),
  },

  /** Consulta por placa (Simples API, cobrada). O token fica só no SoR. */
  plates: {
    lookup: (plate: string, options: { forceRefresh?: boolean } = {}) =>
      request<PlateLookupResponse>("/plates/lookup", {
        method: "POST",
        body: JSON.stringify({ plate, forceRefresh: Boolean(options.forceRefresh) }),
      }),
    /** Foto da placa (base64/data URI) → placa lida + mesmo resultado do lookup. */
    ocr: (image: string) =>
      request<PlateLookupResponse>("/plates/ocr", {
        method: "POST",
        body: JSON.stringify({ image }),
      }),
    balance: (refresh = false) =>
      request<PlateBalance>("/plates/balance", {
        params: refresh ? { refresh: "true" } : undefined,
      }),
  },

  users: {
    listar: () => request<InternalUser[]>("/users"),
    criar: (body: { username: string; password: string; role: string }) =>
      request<InternalUser>("/users", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    atualizarPapel: (id: number, role: string) =>
      request<InternalUser>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    redefinirSenha: (id: number, password: string) =>
      request<void>(`/users/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password }),
      }),
    deletar: (id: number) =>
      request<void>(`/users/${id}`, { method: "DELETE" }),
  },

  auth: {
    alterarMinhaSenha: (body: { currentPassword: string; newPassword: string }) =>
      request<void>("/api/auth/me/password", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },

  tags: {
    listar: (visibility?: "INTERNAL" | "PUBLIC", q?: string) =>
      request<VehicleTag[]>("/tags", {
        params: {
          ...(visibility ? { visibility } : {}),
          ...(q?.trim() ? { q: q.trim() } : {}),
        },
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
    buscarPorId: (id: string) =>
      request<PartnerDetail>(`/partners/${encodeURIComponent(id)}`),
    /** @deprecated use buscarPorId */
    buscarPorDocumento: (id: string) =>
      request<PartnerDetail>(`/partners/${encodeURIComponent(id)}`),
    criar: (body: Customer) =>
      request<PartnerSummary>("/partners", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    atualizar: (id: string, body: Customer) =>
      request<void>(`/partners/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    deletar: (id: string) =>
      request<void>(`/partners/${encodeURIComponent(id)}`, {
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
    byContact: (options: {
      partnerId?: string;
      document?: string;
      startDate?: string;
      endDate?: string;
      ownershipKind?: OwnershipKind;
      role?: ContactReportRole | string;
      page?: number;
      size?: number;
    }) => {
      const params: Record<string, string> = {
        page: String(options.page ?? 0),
        size: String(options.size ?? 20),
      };
      if (options.partnerId) params.partnerId = options.partnerId;
      if (options.document) params.document = options.document;
      if (options.startDate) params.startDate = options.startDate;
      if (options.endDate) params.endDate = options.endDate;
      if (options.ownershipKind) params.ownershipKind = options.ownershipKind;
      if (options.role) params.role = options.role;
      return request<ContactReport>("/reports/by-contact", { params });
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
  receivables: {
    listar: (options: { page?: number; size?: number; search?: string; status?: ReceivableFilter } = {}) => {
      const params: Record<string, string> = {
        page: String(options.page ?? 0),
        size: String(options.size ?? 20),
      };
      if (options.search?.trim()) params.search = options.search.trim();
      if (options.status) params.status = options.status;
      return request<PageResponse<ReceivableAccount>>("/receivables", { params });
    },
    resumo: () => request<ReceivableSummary>("/receivables/summary"),
    buscar: (id: string) => request<ReceivableAccount>(`/receivables/${encodeURIComponent(id)}`),
    criar: (body: ReceivableCreate) =>
      request<ReceivableAccount>("/receivables", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    cancelar: (id: string) =>
      request<ReceivableAccount>(`/receivables/${encodeURIComponent(id)}`, { method: "DELETE" }),
    darBaixa: (installmentId: string, paidDate?: string) =>
      request<ReceivableAccount>(`/receivables/installments/${encodeURIComponent(installmentId)}/pay`, {
        method: "POST",
        body: JSON.stringify(paidDate ? { paidDate } : {}),
      }),
    estornar: (installmentId: string) =>
      request<ReceivableAccount>(`/receivables/installments/${encodeURIComponent(installmentId)}/unpay`, {
        method: "POST",
      }),
  },
  fiscal: {
    status: () => request<FiscalStatusInfo>("/fiscal/status"),
    testarConexao: () => request<FiscalCheckResult>("/fiscal/status/check", { method: "POST" }),
    listar: (options: {
      page?: number;
      size?: number;
      status?: string;
      direction?: string;
      environment?: string;
      divergence?: string;
      search?: string;
      sourceKind?: FiscalSourceKind;
      sourceId?: number;
      vehicleId?: string;
    } = {}) => {
      const params: Record<string, string> = {
        page: String(options.page ?? 0),
        size: String(options.size ?? 20),
      };
      if (options.status) params.status = options.status;
      if (options.direction) params.direction = options.direction;
      if (options.environment) params.environment = options.environment;
      if (options.divergence) params.divergence = options.divergence;
      if (options.search?.trim()) params.search = options.search.trim();
      if (options.sourceKind) params.sourceKind = options.sourceKind;
      if (options.sourceId != null) params.sourceId = String(options.sourceId);
      if (options.vehicleId) params.vehicleId = options.vehicleId;
      return request<PageResponse<FiscalDocument>>("/fiscal/documents", { params });
    },
    resumo: (sourceKind: Exclude<FiscalSourceKind, "RETURN">, ids: number[]) =>
      request<FiscalSummary>("/fiscal/documents/summary", {
        params: { sourceKind, ids: ids.join(",") },
      }),
    previa: (sourceKind: FiscalSourceKind, sourceId: number, paymentMethod?: string) =>
      request<FiscalPreview>("/fiscal/preview", {
        params: {
          sourceKind,
          sourceId: String(sourceId),
          ...(paymentMethod ? { paymentMethod } : {}),
        },
      }),
    emitir: (body: {
      sourceKind: FiscalSourceKind;
      sourceId: number;
      direction: FiscalDirection;
      paymentMethod?: string;
      confirm: true;
    }) =>
      request<FiscalDocument>("/fiscal/documents", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    detalhe: (id: number) => request<FiscalDocument>(`/fiscal/documents/${id}`),
    atualizar: (id: number) =>
      request<FiscalDocument>(`/fiscal/documents/${id}/refresh`, { method: "POST" }),
    cancelar: (id: number, body: { justification: string; confirmNumber: string }) =>
      request<FiscalDocument>(`/fiscal/documents/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    manter: (id: number, reason: string) =>
      request<FiscalDocument>(`/fiscal/documents/${id}/keep`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    baixarXml: (doc: FiscalDocument) =>
      downloadAuthenticatedFile(
        `/fiscal/documents/${doc.id}/xml`,
        `${doc.accessKey ? `NFe${doc.accessKey}` : doc.ref}.xml`,
        "save"
      ),
    abrirDanfe: (doc: FiscalDocument) =>
      downloadAuthenticatedFile(
        `/fiscal/documents/${doc.id}/danfe`,
        `${doc.accessKey ? `NFe${doc.accessKey}` : doc.ref}.pdf`,
        "open"
      ),
  },

  interests: {
    listar: (
      page: number = 0,
      size: number = 20,
      status?: VehicleInterestStatus
    ) => {
      const params: Record<string, string> = {
        ...buildPaginationParams(page, size, "createdAt,desc"),
      };
      if (status) params.status = status;
      return request<PageResponse<VehicleInterest>>("/vehicles/interests", { params });
    },
    criar: (body: VehicleInterestCreate) =>
      request<VehicleInterest>("/vehicles/interests", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    completar: (id: string) =>
      request<VehicleInterest>(`/vehicles/interests/${encodeURIComponent(id)}/complete`, {
        method: "PATCH",
      }),
    cancelar: (id: string) =>
      request<VehicleInterest>(`/vehicles/interests/${encodeURIComponent(id)}/cancel`, {
        method: "PATCH",
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
