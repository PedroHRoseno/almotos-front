"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SearchableSelectOption<T = string> {
  value: T;
  label: string;
  searchText?: string; // Texto adicional para busca (opcional)
}

export interface SearchableSelectProps<T = string> {
  options: SearchableSelectOption<T>[];
  value?: T;
  onValueChange?: (value: T | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  error?: boolean;
  allowClear?: boolean;
  /** Chamado a cada alteração do campo de busca (útil para busca no servidor). */
  onSearchChange?: (term: string) => void;
}

export function SearchableSelect<T extends string = string>({
  options,
  value,
  onValueChange,
  placeholder = "Buscar...",
  disabled = false,
  emptyMessage = "Nenhum resultado encontrado",
  className,
  error = false,
  allowClear = false,
  onSearchChange,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filtrar opções baseado no termo de busca
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return options;

    const term = searchTerm.toLowerCase().trim();
    return options.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(term);
      const searchMatch = option.searchText?.toLowerCase().includes(term);
      return labelMatch || searchMatch;
    });
  }, [options, searchTerm]);

  // Encontrar a opção selecionada
  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Fechar quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchTerm("");
        onSearchChange?.("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onSearchChange]);

  const handleSelect = (optionValue: T) => {
    onValueChange?.(optionValue);
    setOpen(false);
    setSearchTerm("");
    onSearchChange?.("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.(undefined);
    setSearchTerm("");
    onSearchChange?.("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative min-w-0 w-full", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full min-w-0 justify-between overflow-hidden rounded-xl",
          !selectedOption && "text-muted-foreground",
          error && "border-destructive",
          disabled && "cursor-not-allowed opacity-50"
        )}
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {allowClear && selectedOption && (
            <X
              className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
          <div className="p-2">
            <Input
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => {
                const next = e.target.value;
                setSearchTerm(next);
                onSearchChange?.(next);
              }}
              className="h-9"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-x-hidden overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={String(option.value)}
                  className={cn(
                    "relative flex min-w-0 cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-surface-hover hover:text-ink",
                    value === option.value && "bg-surface-hover text-ink"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
