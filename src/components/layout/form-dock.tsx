"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
  PanelRightClose,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Painel de formulários acoplado à direita.
 *
 * O conteúdo vive no layout raiz, não na página: dá para navegar pelo sistema
 * (consultar uma moto, um contato, a FIPE) sem perder o que já foi digitado.
 * Em telas grandes ele empurra a página; em telas pequenas cobre a tela e
 * pode ser minimizado numa pílula.
 */

export interface DockEntry {
  id: string;
  title: string;
  description?: ReactNode;
  content: ReactNode;
  /** Chamado quando o painel fecha (pelo usuário ou por `close`). */
  onClosed?: () => void;
  /** Aba que estava ativa quando esta abriu: volta para ela ao fechar. */
  openerId?: string | null;
}

interface DockActions {
  open: (entry: DockEntry) => void;
  update: (id: string, patch: Partial<Omit<DockEntry, "id">>) => void;
  /** Fecha sem confirmação (ex.: depois de salvar). */
  close: (id: string) => void;
  /** Fecha pedindo confirmação: o que foi digitado se perde. */
  requestClose: (id: string) => void;
  focus: (id: string) => void;
}

interface DockState {
  entries: DockEntry[];
  activeId: string | null;
  collapsed: boolean;
  wide: boolean;
  width: number;
}

const DockActionsContext = createContext<DockActions | null>(null);
const DockStateContext = createContext<
  (DockState & {
    setCollapsed: (value: boolean) => void;
    setWide: (value: boolean) => void;
    setWidth: (value: number) => void;
    pendingClose: string | null;
    cancelClose: () => void;
  }) | null
>(null);

const WIDTH_KEY = "almotos:dock-width";
export const DOCK_MIN_WIDTH = 400;
export const DOCK_DEFAULT_WIDTH = 480;
export const DOCK_WIDE_WIDTH = 720;
export const DOCK_RAIL_WIDTH = 56;

function clampWidth(value: number) {
  const max = typeof window === "undefined" ? 960 : Math.max(DOCK_MIN_WIDTH, window.innerWidth * 0.6);
  return Math.round(Math.min(Math.max(value, DOCK_MIN_WIDTH), max));
}

export function FormDockProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<DockEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [wide, setWide] = useState(false);
  const [width, setWidthState] = useState(DOCK_DEFAULT_WIDTH);
  const [pendingClose, setPendingClose] = useState<string | null>(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(WIDTH_KEY));
      if (stored) setWidthState(clampWidth(stored));
    } catch {
      /* sem storage: largura padrão */
    }
  }, []);

  const setWidth = useCallback((value: number) => {
    const next = clampWidth(value);
    setWidthState(next);
    setWide(false);
    try {
      window.localStorage.setItem(WIDTH_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const close = useCallback((id: string) => {
    const entry = entriesRef.current.find((item) => item.id === id);
    if (!entry) return;
    const remaining = entriesRef.current.filter((item) => item.id !== id);
    entriesRef.current = remaining;
    setEntries(remaining);
    setActiveId((active) => {
      if (active !== id) return active;
      const opener = remaining.find((item) => item.id === entry.openerId);
      return opener?.id ?? remaining[remaining.length - 1]?.id ?? null;
    });
    setPendingClose((pending) => (pending === id ? null : pending));
    entry.onClosed?.();
  }, []);

  const actions = useMemo<DockActions>(
    () => ({
      open: (entry) => {
        setEntries((current) => {
          const index = current.findIndex((item) => item.id === entry.id);
          if (index === -1) {
            const openerId = activeRef.current !== entry.id ? activeRef.current : null;
            return [...current, { ...entry, openerId }];
          }
          // Já aberto: só traz para frente e atualiza título/callback (o form não reinicia).
          const next = [...current];
          next[index] = { ...current[index], ...entry };
          return next;
        });
        setActiveId(entry.id);
        setCollapsed(false);
      },
      update: (id, patch) => {
        setEntries((current) =>
          current.some((item) => item.id === id)
            ? current.map((item) => (item.id === id ? { ...item, ...patch } : item))
            : current
        );
      },
      close,
      requestClose: (id) => setPendingClose(id),
      focus: (id) => {
        setActiveId(id);
        setCollapsed(false);
      },
    }),
    [close]
  );

  const state = useMemo(
    () => ({
      entries,
      activeId,
      collapsed,
      wide,
      width,
      setCollapsed,
      setWide,
      setWidth,
      pendingClose,
      cancelClose: () => setPendingClose(null),
    }),
    [entries, activeId, collapsed, wide, width, setWidth, pendingClose]
  );

  return (
    <DockActionsContext.Provider value={actions}>
      <DockStateContext.Provider value={state}>{children}</DockStateContext.Provider>
    </DockActionsContext.Provider>
  );
}

export function useFormDock(): DockActions {
  const ctx = useContext(DockActionsContext);
  if (!ctx) throw new Error("useFormDock precisa do FormDockProvider");
  return ctx;
}

function useDockState() {
  const ctx = useContext(DockStateContext);
  if (!ctx) throw new Error("useDockState precisa do FormDockProvider");
  return ctx;
}

/** Largura que a página precisa reservar à direita (0 sem painel). */
export function useDockOffset(): number {
  const { entries, collapsed, wide, width } = useDockState();
  if (entries.length === 0) return 0;
  if (collapsed) return DOCK_RAIL_WIDTH;
  return wide ? Math.max(width, DOCK_WIDE_WIDTH) : width;
}

/**
 * Ponte declarativa, no formato do antigo `<Sheet open onOpenChange>`.
 * Abrir manda o conteúdo para o painel; sair da página NÃO fecha — o form continua lá.
 */
export function DockedForm({
  id,
  open,
  onOpenChange,
  title,
  description,
  children,
  closeOnUnmount = false,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Para forms abertos de dentro de outro form do painel: some junto com o "pai". */
  closeOnUnmount?: boolean;
}) {
  const dock = useFormDock();
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  /** Id aberto por esta instância (o `id` pode mudar junto com `open`, ex.: placa). */
  const openedId = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      const previous = openedId.current;
      openedId.current = id;
      if (previous && previous !== id) dock.close(previous);
      dock.open({
        id,
        title,
        description,
        content: children,
        onClosed: () => {
          // Fechado pelo usuário no painel: avisa a página. Fechado pela página: nada a fazer.
          if (openedId.current !== id) return;
          openedId.current = null;
          onOpenChangeRef.current(false);
        },
      });
    } else if (openedId.current) {
      const previous = openedId.current;
      openedId.current = null;
      dock.close(previous);
    }
    // `children` muda a cada render da página: só reenvia enquanto aberto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  useEffect(() => {
    if (open) dock.update(id, { title, description, content: children });
  }, [open, id, title, description, children, dock]);

  useEffect(() => {
    if (!closeOnUnmount) return;
    return () => {
      const previous = openedId.current;
      openedId.current = null;
      if (previous) dock.close(previous);
    };
  }, [closeOnUnmount, dock]);

  return null;
}

function DockHeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {children}
    </button>
  );
}

/** O painel em si — renderizado uma vez no layout. */
export function FormDock() {
  const dock = useFormDock();
  const {
    entries,
    activeId,
    collapsed,
    wide,
    setCollapsed,
    setWide,
    setWidth,
    pendingClose,
    cancelClose,
  } = useDockState();
  const offset = useDockOffset();
  const [dragging, setDragging] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollByTab = useRef(new Map<string, number>());
  const shownId = useRef<string | null>(null);
  const currentId =
    (entries.find((item) => item.id === activeId) ?? entries[entries.length - 1])?.id ?? null;

  // Cada aba lembra onde estava a rolagem.
  // (onScroll já grava a posição; aqui só restaura, antes do paint.)
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body || shownId.current === currentId) return;
    shownId.current = currentId;
    body.scrollTop = currentId ? scrollByTab.current.get(currentId) ?? 0 : 0;
  }, [currentId]);

  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(true);
      const move = (e: PointerEvent) => setWidth(window.innerWidth - e.clientX);
      const up = () => {
        setDragging(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [setWidth]
  );

  if (entries.length === 0) return null;

  const active = entries.find((item) => item.id === activeId) ?? entries[entries.length - 1];
  const pendingEntry = entries.find((item) => item.id === pendingClose);

  return (
    <>
      {/* Pílula no celular quando minimizado */}
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-line bg-surface px-4 py-3 text-sm font-medium text-ink shadow-2xl lg:hidden"
        >
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand" />
          <span className="truncate">{active.title}</span>
          {entries.length > 1 && (
            <span className="rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
              {entries.length}
            </span>
          )}
        </button>
      )}

      <aside
        aria-label="Formulários abertos"
        style={{ "--dock-w": `${offset}px` } as React.CSSProperties}
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex flex-col border-l border-line bg-canvas shadow-2xl",
          "max-lg:inset-0 max-lg:w-full max-lg:border-l-0",
          "lg:z-30 lg:w-[var(--dock-w)] lg:shadow-[-12px_0_32px_-24px_rgba(0,0,0,0.6)]",
          !dragging && "transition-[width] duration-300 ease-out-expo",
          collapsed && "max-lg:hidden"
        )}
      >
        {/* Alça de redimensionar */}
        {!collapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar painel"
            onPointerDown={startResize}
            onDoubleClick={() => setWide(!wide)}
            className={cn(
              "group absolute inset-y-0 -left-1 z-10 hidden w-2 cursor-col-resize lg:block",
            )}
          >
            <span
              className={cn(
                "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-brand",
                dragging && "bg-brand"
              )}
            />
          </div>
        )}

        {collapsed ? (
          /* Trilho vertical (desktop) */
          <div className="hidden h-full flex-col items-center gap-2 py-3 lg:flex">
            <DockHeaderButton label="Expandir painel" onClick={() => setCollapsed(false)}>
              <ChevronsLeft className="h-4 w-4" />
            </DockHeaderButton>
            <div className="h-px w-8 bg-line" />
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => dock.focus(entry.id)}
                title={entry.title}
                className={cn(
                  "flex min-h-0 flex-1 items-center justify-center rounded-lg px-1 py-3 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink",
                  entry.id === active.id && "bg-surface text-ink ring-1 ring-line"
                )}
                style={{ maxHeight: "14rem" }}
              >
                <span className="truncate [writing-mode:vertical-rl] rotate-180">{entry.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <header className="shrink-0 border-b border-line bg-canvas">
              {entries.length > 1 && (
                <div className="flex gap-1 overflow-x-auto px-3 pt-2" role="tablist">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "group flex min-w-0 max-w-[14rem] shrink-0 items-center gap-1 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs",
                        entry.id === active.id
                          ? "border-line bg-surface text-ink"
                          : "border-transparent text-ink-muted hover:text-ink"
                      )}
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={entry.id === active.id}
                        onClick={() => dock.focus(entry.id)}
                        className="min-w-0 truncate font-medium"
                      >
                        {entry.title}
                      </button>
                      <button
                        type="button"
                        aria-label={`Fechar ${entry.title}`}
                        onClick={() => dock.requestClose(entry.id)}
                        className="rounded p-0.5 opacity-60 hover:bg-surface-hover hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-ink">{active.title}</h2>
                  {active.description ? (
                    <p className="mt-0.5 text-xs text-ink-muted">{active.description}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <span className="hidden lg:contents">
                    <DockHeaderButton
                      label={wide ? "Largura normal" : "Alargar painel"}
                      onClick={() => setWide(!wide)}
                    >
                      {wide ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </DockHeaderButton>
                    <DockHeaderButton label="Recolher para a lateral" onClick={() => setCollapsed(true)}>
                      <ChevronsRight className="h-4 w-4" />
                    </DockHeaderButton>
                  </span>
                  <span className="lg:hidden">
                    <DockHeaderButton label="Minimizar" onClick={() => setCollapsed(true)}>
                      <PanelRightClose className="h-4 w-4" />
                    </DockHeaderButton>
                  </span>
                  <DockHeaderButton label="Fechar formulário" onClick={() => dock.requestClose(active.id)}>
                    <X className="h-4 w-4" />
                  </DockHeaderButton>
                </div>
              </div>
            </header>
          </>
        )}

        {/* Todos os forms ficam montados: trocar de aba ou recolher não apaga nada. */}
        <div
          ref={bodyRef}
          onScroll={(event) => {
            if (shownId.current) scrollByTab.current.set(shownId.current, event.currentTarget.scrollTop);
          }}
          className={cn("min-h-0 flex-1 overflow-y-auto overflow-x-hidden", collapsed && "hidden")}
        >
          {entries.map((entry) => (
            <div
              key={entry.id}
              role="tabpanel"
              hidden={entry.id !== active.id}
              className="min-w-0 p-4 pb-10"
            >
              {entry.content}
            </div>
          ))}
        </div>
      </aside>

      <AlertDialog open={pendingEntry != null} onOpenChange={(open) => !open && cancelClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar “{pendingEntry?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              O que foi preenchido neste formulário será descartado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingEntry && dock.close(pendingEntry.id)}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
