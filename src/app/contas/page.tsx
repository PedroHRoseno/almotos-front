"use client";

import { useCallback, useEffect, useState } from "react";
import { Landmark, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { FIELD_HINTS } from "@/lib/field-hints";
import { formatBRL } from "@/lib/masks";
import type { BankAccount, BankAccountOwner, BankAccountsOverview } from "@/types";
import { toast } from "sonner";

const OWNER_LABEL: Record<BankAccountOwner, string> = {
  PEDRO: "Pedro",
  MAE: "Mãe",
  PAI: "Pai",
  LOJA: "Loja",
};

export default function ContasPage() {
  const [overview, setOverview] = useState<BankAccountsOverview | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reconcile, setReconcile] = useState<BankAccount | null>(null);
  const [realBalance, setRealBalance] = useState<number | undefined>();
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [ownerPerson, setOwnerPerson] = useState<BankAccountOwner>("LOJA");
  const [initialBalance, setInitialBalance] = useState<number | undefined>(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.bankAccounts
      .listar()
      .then(setOverview)
      .catch(() => setOverview(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = overview?.totalsByOwner || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            Contas & Bancos
          </h1>
          <p className="text-sm text-muted-foreground">
            Saldos por pessoa e da loja, com ajuste pelo extrato real.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova conta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(["PEDRO", "MAE", "PAI", "LOJA"] as BankAccountOwner[]).map((owner) => (
          <Card key={owner}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{OWNER_LABEL[owner]}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{formatBRL(totals[owner] || 0)}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saldo unificado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatBRL(overview?.unifiedBalance || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Contas cadastradas
          </CardTitle>
          <CardDescription>Saldo = saldo inicial + entradas − saídas daquela conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(overview?.accounts || []).map((account) => (
            <div
              key={account.id}
              className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-ink">{account.name}</p>
                <p className="text-xs text-ink-muted">
                  {account.bankName} · {OWNER_LABEL[account.ownerPerson]}{" "}
                  {account.isActive ? "" : "· inativa"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="tabular-nums font-semibold">{formatBRL(account.balance)}</p>
                <Button size="sm" variant="outline" onClick={() => {
                  setReconcile(account);
                  setRealBalance(account.balance);
                }}>
                  Ajuste de saldo real
                </Button>
              </div>
            </div>
          ))}
          {(overview?.accounts || []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma conta ainda. Cadastre a primeira.</p>
          )}
        </CardContent>
      </Card>

      <Sheet modal={false} open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova conta</SheetTitle>
            <SheetDescription>PIX, banco ou caixa físico de cada titular.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <FormField name="name" label="Nome da conta" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nubank Loja" />
            </FormField>
            <FormField name="bankName" label="Banco" required>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Nubank" />
            </FormField>
            <FormField name="ownerPerson" label="Titular" required>
              <select
                className="flex h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm"
                value={ownerPerson}
                onChange={(e) => setOwnerPerson(e.target.value as BankAccountOwner)}
              >
                {Object.entries(OWNER_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField name="initialBalance" label="Saldo inicial">
              <CurrencyInput
                id="initialBalance"
                value={initialBalance}
                onValueChange={setInitialBalance}
              />
            </FormField>
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await api.bankAccounts.criar({
                    name,
                    bankName,
                    ownerPerson,
                    initialBalance: initialBalance ?? 0,
                    isActive: true,
                  });
                  toast.success("Conta criada.");
                  setCreateOpen(false);
                  setName("");
                  setBankName("");
                  load();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Erro ao criar conta.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Salvar conta
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet modal={false} open={!!reconcile} onOpenChange={(open) => !open && setReconcile(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Ajuste de saldo real</SheetTitle>
            <SheetDescription>
              {reconcile ? `${reconcile.name} está com ${formatBRL(reconcile.balance)} no sistema.` : ""}
            </SheetDescription>
          </SheetHeader>
          <FormField name="realBalance" label="Saldo no app do banco" hint={FIELD_HINTS.realBalance} required>
            <CurrencyInput id="realBalance" value={realBalance} onValueChange={setRealBalance} />
          </FormField>
          <Button
            className="mt-4"
            disabled={saving || realBalance == null}
            onClick={async () => {
              if (!reconcile || realBalance == null) return;
              setSaving(true);
              try {
                await api.bankAccounts.conciliar(reconcile.id, realBalance);
                toast.success("Saldo conciliado.");
                setReconcile(null);
                load();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Erro ao conciliar.");
              } finally {
                setSaving(false);
              }
            }}
          >
            Conciliar
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
