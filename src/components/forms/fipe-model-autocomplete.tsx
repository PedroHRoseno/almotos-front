"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FipeModel } from "@/types";

type FipeModelAutocompleteProps = {
  id?: string;
  brand: string;
  year?: number;
  value: string;
  codigoFipe?: string | null;
  error?: boolean;
  disabled?: boolean;
  onModelChange: (modelName: string, codigoFipe: string | null) => void;
};

export function FipeModelAutocomplete({
  id,
  brand,
  year,
  value,
  codigoFipe,
  error,
  disabled,
  onModelChange,
}: FipeModelAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FipeModel[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (!brand || query.length < 2) {
      setItems([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      api.fipe
        .models(brand, query)
        .then((res) => {
          if (cancelled) return;
          setAvailable(res.available);
          setItems(res.items || []);
        })
        .catch(() => {
          if (cancelled) return;
          setAvailable(false);
          setItems([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [brand, value]);

  useEffect(() => {
    const codigoModelo = selectedCodeRef.current;
    if (!codigoModelo || !year || !brand) return;
    let cancelled = false;
    setResolving(true);
    api.fipe
      .codigo(brand, codigoModelo, year)
      .then((res) => {
        if (cancelled) return;
        onModelChange(value, res.available ? res.codigoFipe ?? null : null);
      })
      .catch(() => {
        if (!cancelled) onModelChange(value, null);
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
    // Só re-resolve quando o ano muda após uma seleção FIPE.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, brand]);

  const handleSelect = async (item: FipeModel) => {
    selectedCodeRef.current = item.codigoModelo;
    setOpen(false);
    if (!year) {
      onModelChange(item.nome, null);
      return;
    }
    setResolving(true);
    try {
      const res = await api.fipe.codigo(brand, item.codigoModelo, year);
      onModelChange(item.nome, res.available ? res.codigoFipe ?? null : null);
    } catch {
      onModelChange(item.nome, null);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        disabled={disabled}
        placeholder="Digite para buscar na FIPE"
        autoComplete="off"
        className={cn(error && "border-destructive")}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          selectedCodeRef.current = null;
          onModelChange(event.target.value, null);
          setOpen(true);
        }}
      />
      {open && (loading || items.length > 0 || (!available && value.trim().length >= 2)) && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-line bg-surface">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Consultando FIPE…
            </div>
          ) : !available ? (
            <p className="px-3 py-2 text-sm text-ink-muted">
              FIPE indisponível. Digite o modelo livremente — o código ficará em branco.
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-muted">
              Nenhum modelo FIPE. Continue digitando para salvar o nome livre.
            </p>
          ) : (
            <ul className="max-h-60 overflow-auto p-1">
              {items.map((item) => (
                <li key={`${item.codigoModelo}-${item.nome}`}>
                  <button
                    type="button"
                    className="flex w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-surface-hover"
                    onClick={() => handleSelect(item)}
                  >
                    {item.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-ink-subtle">
        {resolving
          ? "Resolvendo código FIPE…"
          : codigoFipe
            ? `Código FIPE: ${codigoFipe}`
            : "Sem código FIPE (digitação livre ou API indisponível)."}
      </p>
    </div>
  );
}
