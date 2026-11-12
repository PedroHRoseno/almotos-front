"use client";

import { useEffect, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import type { PlateBalance } from "@/types";

/**
 * Saldo da Simples API compartilhado por todas as telas (consulta de placa,
 * botão no form de moto). Toda resposta de `/plates/lookup` já traz o saldo
 * novo, então `setFromLookup` mantém a UI atualizada sem chamada extra.
 */

type State = { balance: PlateBalance | null; loading: boolean; error: boolean };

const REFRESH_MS = 5 * 60 * 1000;

let state: State = { balance: null, loading: false, error: false };
let lastFetch = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshPlateBalance(force = false): Promise<void> {
  if (inflight) return inflight;
  if (!force && state.balance && Date.now() - lastFetch < REFRESH_MS) return Promise.resolve();
  emit({ loading: true });
  inflight = api.plates
    .balance(force)
    .then((balance) => {
      lastFetch = Date.now();
      emit({ balance, loading: false, error: false });
    })
    .catch(() => emit({ loading: false, error: true }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function setPlateBalanceFromLookup(balance: PlateBalance | null | undefined) {
  if (!balance) return;
  // Resposta sem leitura de saldo (ex.: placa inválida sem token) não apaga o último valor bom.
  if (!balance.available && state.balance?.available && balance.status === "UNKNOWN") return;
  lastFetch = Date.now();
  emit({ balance, error: false });
}

export function usePlateBalance() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => state);

  useEffect(() => {
    void refreshPlateBalance();
    const tick = () => {
      if (document.visibilityState === "visible") void refreshPlateBalance();
    };
    const timer = window.setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  return { ...snapshot, refresh: () => refreshPlateBalance(true) };
}

export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
