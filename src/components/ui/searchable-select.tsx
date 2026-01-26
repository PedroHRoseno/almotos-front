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
  onValueChange?: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  error?: boolean;
  allowClear?: boolean;
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
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleSelect = (optionValue: T) => {
    onValueChange?.(optionValue);
    setOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange?.(undefined as T);
    setSearchTerm("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full justify-between",
          !selectedOption && "text-muted-foreground",
          error && "border-destructive",
          disabled && "cursor-not-allowed opacity-50"
        )}
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
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
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-2">
            <Input
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={String(option.value)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
