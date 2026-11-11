"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeDollarSign,
  Check,
  ClipboardCopy,
  History,
  Loader2,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { FormVeiculo } from "@/components/forms/form-veiculo";
import { useFormDock } from "@/components/layout/form-dock";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/masks";
import { cn } from "@/lib/utils";
import type { FipeAno, FipeConsultaResponse, FipeModel } from "@/types";
import { MOTO_BRANDS } from "@/types";

/* ------------------------------------------------------------------ helpers */

const QUICK_BRANDS = ["HONDA", "YAMAHA", "SUZUKI", "KAWASAKI", "BMW", "TRIUMPH", "SHINERAY", "BAJAJ"];
const MODEL_RENDER_CAP = 80;
const YEARS_WITH_PRICE = 15;
const RECENTS_KEY = "almotos:fipe-recentes";

/** Código FIPE de ano "32000-x" = moto zero km. */
const ZERO_KM = "32000";

function brandLabel(brand: string) {
  return brand.replace(/_/g, " ");
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function matches(nome: string, tokens: string[]) {
  const hay = normalize(nome);
  return tokens.every((token) => hay.includes(token));
}

function yearLabel(ano: FipeAno) {
  if (ano.codigoAno.startsWith(ZERO_KM)) return ano.nome.replace(/^32000/, "Zero KM");
  return ano.nome;
}

function modelYearFromCode(codigoAno: string): number {
  if (codigoAno.startsWith(ZERO_KM)) return new Date().getFullYear();
  const match = codigoAno.match(/^(\d{4})/);
  return match ? Number(match[1]) : new Date().getFullYear();
}

/** Zero KM primeiro, depois do ano mais novo ao mais velho. */
function sortAnos(items: FipeAno[]): FipeAno[] {
  const key = (ano: FipeAno) => {
    const match = ano.codigoAno.match(/^(\d+)/);
    return match ? Number(match[1]) : 0;
  };
  return [...items].sort((a, b) => key(b) - key(a) || a.nome.localeCompare(b.nome));
}

type Recent = {
  brand: string;
  modelo: string;
  codigoModelo: string;
  codigoAno: string;
  anoLabel: string;
  valor: number | null;
};

function readRecents(): Recent[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Recent[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function writeRecents(list: Recent[]) {
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, 6)));
  } catch {
    /* sem storage */
  }
}

type PriceState = { status: "loading" } | { status: "done"; valor: number | null; data: FipeConsultaResponse };

/* --------------------------------------------------------------------- page */

export default function ConsultaFipePage() {
  const dock = useFormDock();
  const [brand, setBrand] = useState("HONDA");
  const [models, setModels] = useState<FipeModel[] | null>(null);
  const [modelsAvailable, setModelsAvailable] = useState(true);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [model, setModel] = useState<FipeModel | null>(null);
  const [anos, setAnos] = useState<FipeAno[] | null>(null);
  const [anosAvailable, setAnosAvailable] = useState(true);
  const [codigoAno, setCodigoAno] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, PriceState>>({});
  const [recents, setRecents] = useState<Recent[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Ano a selecionar quando os anos chegarem (vindo de uma consulta recente). */
  const pendingYear = useRef<string | null>(null);

  useEffect(() => setRecents(readRecents()), []);

  // 1) Modelos da marca: baixa a lista toda uma vez e filtra no navegador (instantâneo).
  useEffect(() => {
    let cancelled = false;
    setModels(null);
    api.fipe
      .models(brand, undefined, 1000)
      .then((res) => {
        if (cancelled) return;
        setModelsAvailable(res.available);
        setModels(res.items ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setModelsAvailable(false);
        setModels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [brand]);

  // 2) Anos do modelo escolhido.
  useEffect(() => {
    setAnos(null);
    setPrices({});
    if (!model) return;
    let cancelled = false;
    api.fipe
      .anos(brand, model.codigoModelo)
      .then((res) => {
        if (cancelled) return;
        setAnosAvailable(res.available);
        const items = sortAnos(res.items ?? []);
        setAnos(items);
        const wanted = pendingYear.current;
        pendingYear.current = null;
        if (wanted && items.some((item) => item.codigoAno === wanted)) setCodigoAno(wanted);
        else if (items.length > 0) setCodigoAno(items[0].codigoAno);
      })
      .catch(() => {
        if (cancelled) return;
        setAnosAvailable(false);
        setAnos([]);
      });
    return () => {
      cancelled = true;
    };
  }, [brand, model]);

  // 3) Valor de cada ano (os mais recentes), 3 por vez, para comparar a desvalorização.
  useEffect(() => {
    if (!model || !anos || anos.length === 0) return;
    let cancelled = false;
    const queue = anos.slice(0, YEARS_WITH_PRICE).map((ano) => ano.codigoAno);
    if (codigoAno && !queue.includes(codigoAno)) queue.unshift(codigoAno);
    setPrices(Object.fromEntries(queue.map((code) => [code, { status: "loading" } as PriceState])));

    const worker = async () => {
      while (!cancelled && queue.length > 0) {
        const code = queue.shift() as string;
        let data: FipeConsultaResponse;
        try {
          data = await api.fipe.consultaPorCodigoAno(brand, model.codigoModelo, code);
        } catch {
          data = { available: false };
        }
        if (cancelled) return;
        setPrices((current) => ({
          ...current,
          [code]: { status: "done", valor: data.valor ?? null, data },
        }));
      }
    };
    void Promise.all([worker(), worker(), worker()]);
    return () => {
      cancelled = true;
    };
    // codigoAno de fora da janela entra só na primeira leva
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, model, anos]);

  // Ano fora da janela de 15 escolhido depois: busca só ele.
  useEffect(() => {
    if (!model || !anos || !codigoAno || prices[codigoAno]) return;
    if (anos.slice(0, YEARS_WITH_PRICE).some((ano) => ano.codigoAno === codigoAno)) return;
    let cancelled = false;
    setPrices((current) => ({ ...current, [codigoAno]: { status: "loading" } }));
    api.fipe
      .consultaPorCodigoAno(brand, model.codigoModelo, codigoAno)
      .catch(() => ({ available: false }) as FipeConsultaResponse)
      .then((data) => {
        if (!cancelled)
          setPrices((current) => ({ ...current, [codigoAno]: { status: "done", valor: data.valor ?? null, data } }));
      });
    return () => {
      cancelled = true;
    };
  }, [brand, model, anos, codigoAno, prices]);

  const tokens = useMemo(
    () => query.split(/\s+/).map(normalize).filter(Boolean),
    [query]
  );
  const filtered = useMemo(
    () => (models ?? []).filter((item) => tokens.length === 0 || matches(item.nome, tokens)),
    [models, tokens]
  );
  const visible = filtered.slice(0, MODEL_RENDER_CAP);

  useEffect(() => setHighlight(0), [query, brand]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const selectedPrice = codigoAno ? prices[codigoAno] : undefined;
  const result = selectedPrice?.status === "done" ? selectedPrice.data : null;
  const selectedAno = anos?.find((item) => item.codigoAno === codigoAno) ?? null;

  const maxPrice = useMemo(() => {
    let max = 0;
    for (const state of Object.values(prices)) {
      if (state.status === "done" && state.valor) max = Math.max(max, state.valor);
    }
    return max;
  }, [prices]);

  // Comparação com o ano anterior da lista (mesmo combustível quando der).
  const delta = useMemo(() => {
    if (!anos || !codigoAno || !result?.valor) return null;
    const index = anos.findIndex((item) => item.codigoAno === codigoAno);
    const older = anos.slice(index + 1).find((item) => {
      const state = prices[item.codigoAno];
      return state?.status === "done" && state.valor;
    });
    if (!older) return null;
    const olderState = prices[older.codigoAno];
    if (olderState?.status !== "done" || !olderState.valor) return null;
    const diff = result.valor - olderState.valor;
    return { diff, pct: (diff / olderState.valor) * 100, label: yearLabel(older) };
  }, [anos, codigoAno, prices, result?.valor]);

  // Guarda nas recentes quando o valor chega.
  useEffect(() => {
    if (!model || !codigoAno || !result || !selectedAno) return;
    const entry: Recent = {
      brand,
      modelo: model.nome,
      codigoModelo: model.codigoModelo,
      codigoAno,
      anoLabel: yearLabel(selectedAno),
      valor: result.valor ?? null,
    };
    setRecents((current) => {
      const next = [
        entry,
        ...current.filter(
          (item) => !(item.codigoModelo === entry.codigoModelo && item.codigoAno === entry.codigoAno && item.brand === entry.brand)
        ),
      ].slice(0, 6);
      writeRecents(next);
      return next;
    });
  }, [brand, model, codigoAno, result, selectedAno]);

  const changeBrand = useCallback((next: string) => {
    setBrand(next);
    setModel(null);
    setCodigoAno(null);
    setQuery("");
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  const chooseModel = useCallback((item: FipeModel) => {
    setModel(item);
    setCodigoAno(null);
  }, []);

  const resetModel = useCallback(() => {
    setModel(null);
    setCodigoAno(null);
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  const openRecent = (item: Recent) => {
    pendingYear.current = item.codigoAno;
    if (item.brand !== brand) setBrand(item.brand);
    setQuery("");
    setCodigoAno(null);
    setModel({ nome: item.modelo, codigoModelo: item.codigoModelo });
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const cadastrar = () => {
    if (!model || !codigoAno) return;
    const year = modelYearFromCode(codigoAno);
    const id = `vehicle:fipe:${model.codigoModelo}:${codigoAno}`;
    dock.open({
      id,
      title: `Cadastrar ${model.nome}`,
      description: "Marca, modelo e ano vieram da Consulta FIPE. Confira e complete o resto.",
      content: (
        <FormVeiculo
          insideModal
          includePhotos={false}
          includeCatalogFields
          initialValues={{
            brand,
            modelName: model.nome,
            modelYear: year,
            manufactureYear: year,
            codigoFipe: result?.codigoFipe ?? null,
          }}
          initialCodigoModelo={model.codigoModelo}
          onSuccessWithPlate={() => dock.close(id)}
        />
      ),
    });
  };

  const onSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, visible.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === "Enter" && visible[highlight]) {
      event.preventDefault();
      chooseModel(visible[highlight]);
    } else if (event.key === "Escape") {
      setQuery("");
    }
  };

  const otherBrandSelected = !QUICK_BRANDS.includes(brand);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Consulta FIPE</h1>
        <p className="text-ink-muted">
          Valor de tabela de qualquer moto, sem cadastrar nada. Só referência — não grava no estoque.
        </p>
      </div>

      {recents.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-subtle">
            <History className="h-3.5 w-3.5" /> Recentes
          </span>
          {recents.map((item) => (
            <button
              key={`${item.brand}-${item.codigoModelo}-${item.codigoAno}`}
              type="button"
              onClick={() => openRecent(item)}
              className="group flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-left text-xs text-ink transition-colors hover:border-brand/60"
            >
              <span className="truncate">
                <span className="text-ink-subtle">{brandLabel(item.brand)}</span> {item.modelo} ·{" "}
                {item.anoLabel}
              </span>
              {item.valor != null && (
                <span className="shrink-0 font-semibold tabular-nums text-ink">{formatBRL(item.valor)}</span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setRecents([]);
              writeRecents([]);
            }}
            className="text-xs text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
          >
            limpar
          </button>
        </div>
      )}

      <div className="fipe-layout">
        <div className="fipe-grid grid gap-6">
          {/* ---------------------------------------------------- busca */}
          <section className="min-w-0 space-y-6 rounded-2xl border border-line bg-surface p-4 sm:p-6">
            {/* Marca */}
            <div className="space-y-3">
              <StepLabel n={1} done>
                Marca
              </StepLabel>
              <div className="flex flex-wrap gap-2">
                {QUICK_BRANDS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeBrand(item)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                      brand === item
                        ? "border-brand bg-brand text-white"
                        : "border-line text-ink-muted hover:border-ink-subtle hover:text-ink"
                    )}
                  >
                    {brandLabel(item)}
                  </button>
                ))}
                <div className="w-48">
                  <CreatableCombobox
                    id="fipe-outra-marca"
                    value={otherBrandSelected ? brand : ""}
                    placeholder="Outra marca…"
                    searchPlaceholder="Buscar marca"
                    options={MOTO_BRANDS.filter((item) => !QUICK_BRANDS.includes(item)).map((item) => ({
                      value: item,
                      label: brandLabel(item),
                    }))}
                    onValueChange={(next) => next && changeBrand(next)}
                  />
                </div>
              </div>
            </div>

            {/* Modelo */}
            <div className="space-y-3">
              <StepLabel n={2} done={Boolean(model)}>
                Modelo
              </StepLabel>

              {model ? (
                <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/5 px-4 py-3">
                  <Check className="h-4 w-4 shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{model.nome}</p>
                    <p className="text-xs text-ink-subtle">{brandLabel(brand)}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={resetModel}>
                    Trocar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
                    <input
                      ref={searchRef}
                      autoFocus
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={onSearchKey}
                      placeholder={`Buscar modelo ${brandLabel(brand)} — ex.: cg 160 fan, xre 300, bros`}
                      className="h-14 w-full rounded-xl border border-line bg-canvas pl-12 pr-10 text-base text-ink placeholder:text-ink-subtle focus-visible:border-brand focus-visible:outline-none"
                      aria-label="Buscar modelo"
                      autoComplete="off"
                    />
                    {query && (
                      <button
                        type="button"
                        aria-label="Limpar busca"
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-subtle hover:text-ink"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-subtle">
                    <span>
                      {models == null
                        ? "Carregando modelos…"
                        : !modelsAvailable
                          ? "FIPE indisponível agora. Tente de novo em instantes."
                          : models.length === 0
                            ? `${brandLabel(brand)} não tem modelos na tabela FIPE.`
                            : `${filtered.length} de ${models.length} modelos`}
                    </span>
                    <span className="hidden sm:inline">↑ ↓ para navegar · Enter escolhe</span>
                  </div>

                  {models == null ? (
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-hover" />
                      ))}
                    </div>
                  ) : visible.length > 0 ? (
                    <ul
                      ref={listRef}
                      className="max-h-[22rem] divide-y divide-line-soft overflow-y-auto rounded-xl border border-line"
                    >
                      {visible.map((item, index) => (
                        <li key={item.codigoModelo}>
                          <button
                            type="button"
                            data-index={index}
                            onMouseEnter={() => setHighlight(index)}
                            onClick={() => chooseModel(item)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                              index === highlight ? "bg-surface-hover text-ink" : "text-ink-muted"
                            )}
                          >
                            <Highlighted text={item.nome} tokens={tokens} />
                            <span className="shrink-0 text-xs text-ink-subtle">
                              {index === highlight ? "Enter ↵" : ""}
                            </span>
                          </button>
                        </li>
                      ))}
                      {filtered.length > visible.length && (
                        <li className="px-4 py-2 text-xs text-ink-subtle">
                          +{filtered.length - visible.length} modelos — continue digitando para refinar.
                        </li>
                      )}
                    </ul>
                  ) : models.length > 0 ? (
                    <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
                      Nenhum modelo com “{query}”. Tente menos palavras (ex.: só “160”).
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {/* Ano */}
            {model && (
              <div className="space-y-3">
                <StepLabel n={3} done={Boolean(codigoAno)}>
                  Ano / combustível
                </StepLabel>
                {anos == null ? (
                  <div className="flex items-center gap-2 text-sm text-ink-muted">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando anos…
                  </div>
                ) : anos.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    {anosAvailable ? "Nenhum ano na tabela para este modelo." : "FIPE indisponível agora."}
                  </p>
                ) : (
                  <ul className="grid gap-1.5">
                    {anos.map((ano) => {
                      const state = prices[ano.codigoAno];
                      const valor = state?.status === "done" ? state.valor : null;
                      const selected = ano.codigoAno === codigoAno;
                      return (
                        <li key={ano.codigoAno}>
                          <button
                            type="button"
                            onClick={() => setCodigoAno(ano.codigoAno)}
                            className={cn(
                              "relative flex w-full items-center gap-3 overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                              selected
                                ? "border-brand bg-brand/5 text-ink"
                                : "border-line text-ink-muted hover:border-ink-subtle hover:text-ink"
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "absolute inset-y-0 left-0 transition-[width] duration-500",
                                selected ? "bg-brand/15" : "bg-surface-hover"
                              )}
                              style={{ width: valor && maxPrice ? `${(valor / maxPrice) * 100}%` : "0%" }}
                            />
                            <span className="relative w-36 shrink-0 font-medium">{yearLabel(ano)}</span>
                            <span className="relative ml-auto tabular-nums">
                              {state?.status === "loading" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-subtle" />
                              ) : valor != null ? (
                                <span className={cn(selected && "font-semibold text-ink")}>{formatBRL(valor)}</span>
                              ) : state ? (
                                <span className="text-ink-subtle">—</span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* -------------------------------------------------- resultado */}
          <aside className="fipe-result min-w-0">
            <ResultCard
              brand={brand}
              model={model}
              ano={selectedAno}
              loading={selectedPrice?.status === "loading"}
              result={result}
              delta={delta}
              onCopy={copy}
              onCadastrar={cadastrar}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- pedaços */

function StepLabel({ n, done, children }: { n: number; done?: boolean; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
          done ? "bg-brand text-white" : "border border-line text-ink-subtle"
        )}
      >
        {n}
      </span>
      {children}
    </p>
  );
}

/** Marca em negrito os trechos que casam com o que foi digitado. */
function Highlighted({ text, tokens }: { text: string; tokens: string[] }) {
  if (tokens.length === 0) return <span className="truncate">{text}</span>;
  const words = text.split(/(\s+)/);
  return (
    <span className="truncate">
      {words.map((word, i) => {
        const norm = normalize(word);
        const hit = norm && tokens.some((token) => norm.includes(token) || token.includes(norm));
        return hit ? (
          <strong key={i} className="font-semibold text-ink">
            {word}
          </strong>
        ) : (
          <span key={i}>{word}</span>
        );
      })}
    </span>
  );
}

function ResultCard({
  brand,
  model,
  ano,
  loading,
  result,
  delta,
  onCopy,
  onCadastrar,
}: {
  brand: string;
  model: FipeModel | null;
  ano: FipeAno | null;
  loading: boolean;
  result: FipeConsultaResponse | null;
  delta: { diff: number; pct: number; label: string } | null;
  onCopy: (text: string, label: string) => void;
  onCadastrar: () => void;
}) {
  if (!model || !ano) {
    return (
      <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line p-6 text-center">
        <BadgeDollarSign className="h-8 w-8 text-ink-subtle" />
        <p className="text-sm text-ink-muted">
          {model ? "Escolha o ano para ver o valor." : "Escolha a marca e busque o modelo."}
        </p>
      </div>
    );
  }

  const valor = result?.available ? result.valor ?? null : null;
  const hasValue = result != null && valor != null;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="space-y-1 border-b border-line bg-gradient-to-br from-brand/15 via-transparent to-transparent p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          {brandLabel(brand)} · {yearLabel(ano)}
        </p>
        <p className="text-sm font-medium text-ink">{result?.modelo ?? model.nome}</p>
        <div className="pt-2">
          {loading ? (
            <div className="h-10 w-48 animate-pulse rounded-lg bg-surface-hover" />
          ) : hasValue ? (
            <p className="break-words font-sans text-4xl font-bold tabular-nums tracking-tight text-ink">
              {formatBRL(valor)}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              {result?.available === false ? "FIPE indisponível agora." : "Sem valor FIPE para este ano."}
            </p>
          )}
        </div>
        {delta && hasValue && (
          <p
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              delta.diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-700 dark:text-amber-300"
            )}
          >
            {delta.diff >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {delta.diff >= 0 ? "+" : ""}
            {delta.pct.toFixed(1).replace(".", ",")}% ({formatBRL(delta.diff)}) vs. {delta.label}
          </p>
        )}
      </div>

      {hasValue && (
        <dl className="grid grid-cols-2 gap-4 p-5 text-sm">
          {result.codigoFipe && (
            <div>
              <dt className="text-xs text-ink-subtle">Código FIPE</dt>
              <dd className="flex items-center gap-1 font-mono text-ink">
                {result.codigoFipe}
                <button
                  type="button"
                  aria-label="Copiar código FIPE"
                  onClick={() => onCopy(result.codigoFipe as string, "Código FIPE")}
                  className="rounded p-0.5 text-ink-subtle hover:text-ink"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                </button>
              </dd>
            </div>
          )}
          {result.combustivel && (
            <div>
              <dt className="text-xs text-ink-subtle">Combustível</dt>
              <dd className="text-ink">{result.combustivel}</dd>
            </div>
          )}
          {result.mesReferencia && (
            <div className="col-span-2">
              <dt className="text-xs text-ink-subtle">Mês de referência</dt>
              <dd className="text-ink first-letter:uppercase">{result.mesReferencia.trim().toLowerCase()}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line p-4">
        {hasValue && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCopy(formatBRL(valor), "Valor")}
          >
            <ClipboardCopy className="mr-1.5 h-4 w-4" /> Copiar valor
          </Button>
        )}
        <Button type="button" size="sm" onClick={onCadastrar}>
          <Plus className="mr-1.5 h-4 w-4" /> Cadastrar com este modelo
        </Button>
      </div>
    </div>
  );
}
