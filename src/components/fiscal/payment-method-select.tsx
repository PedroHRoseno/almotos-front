"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/lib/fiscal";

const NONE = "__NONE__";

/** Forma de pagamento (código tPag da NF-e). Vazio = "informo depois, na nota". */
export function PaymentMethodSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value?: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value || NONE} onValueChange={(next) => onChange(next === NONE ? "" : next)}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Não informado" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Não informado (pergunto na hora da nota)</SelectItem>
        {PAYMENT_METHODS.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
