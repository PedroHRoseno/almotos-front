const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const VEHICLES_API_URL =
  process.env.NEXT_PUBLIC_VEHICLES_API_URL ?? "https://tcc-voting-pedro.fun";

type RequestConfig = RequestInit & { params?: Record<string, string> };

async function request<T>(
  baseUrl: string,
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...init } = config;
  const url = new URL(endpoint, baseUrl);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status}: ${res.statusText}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/** Veículo conforme API https://tcc-voting-pedro.fun/api/vehicles */
export interface Veiculo {
  licensePlate: string;
  brand: string;
  modelName: string;
  manufactureYear: number;
  modelYear: number;
  color: string;
  kilometersDriven: number;
  inStock: boolean;
}

export interface VeiculoCreate {
  licensePlate: string;
  brand: string;
  modelName: string;
  manufactureYear: number;
  modelYear: number;
  color: string;
  kilometersDriven: number;
  inStock: boolean;
}

export interface VendaInput {
  veiculoLicensePlate: string;
  clienteNome: string;
  valorVenda: number;
  dataVenda: string;
}

export interface TrocaInput {
  veiculoEntradaLicensePlate: string;
  veiculoSaidaLicensePlate: string;
  valorDiferenca: number;
}

export const api = {
  veiculos: {
    listar: () =>
      request<Veiculo[]>(VEHICLES_API_URL, "/api/vehicles"),
    criar: (body: VeiculoCreate) =>
      request<Veiculo>(VEHICLES_API_URL, "/api/vehicles", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  vendas: {
    registrar: (body: VendaInput) =>
      request<void>(BASE_URL, "/api/vendas", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  trocas: {
    realizar: (body: TrocaInput) =>
      request<void>(BASE_URL, "/api/trocas", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};
