"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type TagInputProps = {
  id?: string;
  visibility: "INTERNAL" | "PUBLIC";
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: boolean;
};

export function TagInput({
  id,
  visibility,
  value,
  onChange,
  placeholder = "Digite e pressione Enter",
  error,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(
    () => new Set(value.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
    [value]
  );

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
    const query = draft.trim();
    let cancelled = false;
    const timer = setTimeout(() => {
      api.tags
        .listar(visibility, query || undefined)
        .then((rows) => {
          if (cancelled) return;
          setSuggestions(
            rows
              .map((row) => row.name)
              .filter((name) => !selected.has(name.trim().toLowerCase()))
          );
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft, visibility, selected]);

  const addTag = (raw: string) => {
    const name = raw.trim();
    if (!name || selected.has(name.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, name]);
    setDraft("");
    setOpen(false);
  };

  const removeTag = (name: string) => {
    onChange(value.filter((tag) => tag !== name));
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5",
          error && "border-destructive"
        )}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              aria-label={`Remover ${tag}`}
              className="rounded-full p-0.5 hover:bg-surface-hover"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          id={id}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          className="h-8 min-w-[10rem] flex-1 border-0 bg-transparent px-1 focus-visible:border-transparent"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setDraft(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag(draft.replace(/,/g, ""));
            }
            if (event.key === "Backspace" && !draft && value.length) {
              removeTag(value[value.length - 1]);
            }
          }}
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="rounded-xl border border-line bg-surface p-1">
          {suggestions.slice(0, 8).map((name) => (
            <li key={name}>
              <button
                type="button"
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-surface-hover"
                onClick={() => addTag(name)}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
