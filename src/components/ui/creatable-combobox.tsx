"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CreatableComboboxOption {
  value: string;
  label: string;
}

export interface CreatableComboboxProps {
  id?: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: CreatableComboboxOption[];
  /** Valores que permanecem no topo da lista, nesta ordem. */
  pinned?: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  createLabel?: (text: string) => string;
  disabled?: boolean;
  error?: boolean;
}

function fold(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function CreatableCombobox({
  id,
  value,
  onValueChange,
  options,
  pinned = [],
  placeholder = "Selecione ou digite",
  searchPlaceholder = "Buscar ou adicionar",
  emptyMessage = "Nenhuma opção encontrada",
  createLabel = (text) => `Adicionar marca: ${text}`,
  disabled = false,
  error = false,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const ordered = React.useMemo(() => {
    const pinnedSet = new Set(pinned);
    const head = pinned
      .map((item) => options.find((option) => option.value === item))
      .filter((option): option is CreatableComboboxOption => Boolean(option));
    const tail = options.filter((option) => !pinnedSet.has(option.value));
    return [...head, ...tail];
  }, [options, pinned]);

  const typed = query.trim().replace(/\s+/g, " ");
  const alreadyListed = ordered.some(
    (option) => fold(option.value) === fold(typed) || fold(option.label) === fold(typed)
  );
  const canCreate = typed.length > 0 && !alreadyListed;
  const selected = ordered.find((option) => option.value === value);
  const buttonLabel = selected?.label || (value ? value.replace(/_/g, " ") : "");

  const choose = (next: string) => {
    onValueChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-xl px-3 font-normal",
            !buttonLabel && "text-ink-subtle",
            error && "border-destructive"
          )}
        >
          <span className="truncate">{buttonLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{canCreate ? createLabel(typed.toUpperCase()) : emptyMessage}</CommandEmpty>
            <CommandGroup>
              {ordered.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => choose(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {canCreate ? (
                <CommandItem
                  value={`adicionar marca ${typed}`}
                  onSelect={() => choose(typed.toUpperCase())}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  {createLabel(typed.toUpperCase())}
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
