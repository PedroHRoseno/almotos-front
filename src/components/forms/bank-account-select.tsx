"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { FormField } from "@/components/ui/form-field";
import { api } from "@/lib/api";
import { FIELD_HINTS } from "@/lib/field-hints";
import type { BankAccount } from "@/types";

const OWNER_LABEL: Record<string, string> = {
  PEDRO: "Pedro",
  MAE: "Mãe",
  PAI: "Pai",
  LOJA: "Loja",
};

export function BankAccountSelect({
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}: {
  value?: string;
  onChange: (id: string | undefined) => void;
  error?: { message?: string };
  required?: boolean;
  disabled?: boolean;
}) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    api.bankAccounts
      .listar()
      .then((data) => setAccounts((data.accounts || []).filter((row) => row.isActive)))
      .catch(() => setAccounts([]));
  }, []);

  const options: SearchableSelectOption[] = useMemo(
    () =>
      accounts.map((account) => ({
        value: account.id,
        label: `${account.name} · ${OWNER_LABEL[account.ownerPerson] || account.ownerPerson}`,
        searchText: `${account.name} ${account.bankName} ${account.ownerPerson}`,
      })),
    [accounts]
  );

  if (accounts.length === 0) return null;

  return (
    <FormField
      name="bankAccountId"
      label="Conta bancária / PIX"
      required={required}
      error={error}
      hint={FIELD_HINTS.bankAccount}
    >
      <SearchableSelect
        options={options}
        value={value || ""}
        onValueChange={onChange}
        placeholder="Escolher conta..."
        emptyMessage="Nenhuma conta cadastrada"
        disabled={disabled}
        error={!!error}
        allowClear
      />
    </FormField>
  );
}
