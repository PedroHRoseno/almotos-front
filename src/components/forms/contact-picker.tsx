"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { api } from "@/lib/api";
import { partnerSelectLabel } from "@/lib/masks";
import type { PartnerSummary } from "@/types";

/** Primeira página ao abrir; o resto vem pela busca no servidor. */
const PAGE_SIZE = 30;
const DEBOUNCE_MS = 250;

/** CPF/CNPJ com máscara vai só com dígitos: a API compara o documento assim. */
export function partnerSearchParam(term: string): string | undefined {
  const trimmed = term.trim();
  if (!trimmed) return undefined;
  const compact = trimmed.replace(/[\s.\-/]/g, "");
  const digits = compact.replace(/\D/g, "");
  if (digits.length >= 3 && digits === compact) return digits;
  return trimmed;
}

/** Cache por sessão do navegador: o contato escolhido continua com nome ao reabrir o form. */
const knownContacts = new Map<string, PartnerSummary>();

export function rememberContact(contact: PartnerSummary) {
  knownContacts.set(contact.id, contact);
}

export interface ContactPickerProps {
  value?: string | null;
  onValueChange: (id: string, contact?: PartnerSummary) => void;
  placeholder?: string;
  emptyMessage?: string;
  error?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
}

/**
 * Seletor de contato com busca no servidor (nome, CPF ou CNPJ).
 * Não baixa a agenda inteira: carrega 30 ao abrir e consulta a API a cada termo.
 * Um `value` que não está na página atual é resolvido por id (GET /partners/{id}).
 */
export function ContactPicker({
  value,
  onValueChange,
  placeholder = "Buscar contato por nome ou documento...",
  emptyMessage = "Nenhum contato encontrado",
  error,
  disabled,
  allowClear = true,
  className,
}: ContactPickerProps) {
  const [results, setResults] = useState<PartnerSummary[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PartnerSummary | null>(
    value ? knownContacts.get(value) ?? null : null
  );
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), query.trim() ? DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!opened) return;
    const current = ++requestId.current;
    setLoading(true);
    api.customers
      .listar(0, PAGE_SIZE, partnerSearchParam(debounced))
      .then((response) => {
        if (current !== requestId.current) return;
        const content = response.content || [];
        content.forEach(rememberContact);
        setResults(content);
        setTotal(response.totalElements ?? content.length);
      })
      .catch(() => {
        if (current === requestId.current) setResults([]);
      })
      .finally(() => {
        if (current === requestId.current) setLoading(false);
      });
  }, [debounced, opened]);

  // Valor vindo de fora (edição, contato recém-criado, dono da moto) que não está na lista.
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    const cached = knownContacts.get(value);
    if (cached) {
      setSelected(cached);
      return;
    }
    let cancelled = false;
    api.customers
      .buscarPorId(value)
      .then((detail) => {
        if (cancelled) return;
        const summary: PartnerSummary = {
          id: detail.id,
          name: detail.name,
          document: detail.document,
          phoneNumber1: detail.phoneNumber1,
          city: detail.address?.city,
        };
        rememberContact(summary);
        setSelected(summary);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, selected?.id]);

  const options: SearchableSelectOption[] = useMemo(() => {
    const list =
      selected && !results.some((item) => item.id === selected.id) ? [selected, ...results] : results;
    return list.map((p) => ({
      value: p.id,
      label: partnerSelectLabel(p.name, p.document, p.city),
    }));
  }, [results, selected]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) setOpened(true);
  }, []);

  const searching = loading || query.trim() !== debounced.trim();
  const hidden = total != null ? total - results.length : 0;
  const footer =
    hidden > 0
      ? `Mostrando ${results.length} de ${total}. Digite nome, CPF ou CNPJ para achar os outros.`
      : undefined;

  return (
    <SearchableSelect
      className={className}
      options={options}
      value={value || undefined}
      onValueChange={(id) => {
        const contact = id ? knownContacts.get(id) : undefined;
        setSelected(contact ?? null);
        onValueChange(id ?? "", contact);
      }}
      onSearchChange={setQuery}
      onOpenChange={handleOpenChange}
      filterLocally={false}
      loading={searching}
      footer={footer}
      placeholder={value && !selected ? "Carregando contato…" : placeholder}
      searchPlaceholder="Nome, CPF ou CNPJ"
      emptyMessage={emptyMessage}
      error={error}
      disabled={disabled}
      allowClear={allowClear}
    />
  );
}
