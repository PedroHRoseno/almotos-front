"use client";

import { AlertTriangle, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFiscalStatus } from "@/lib/fiscal";

/**
 * Faixa fixa de ambiente fiscal. Some em produção; em homologação ou no QA
 * deixa claro que a nota não tem valor fiscal.
 */
export function FiscalEnvironmentBanner({ className }: { className?: string }) {
  const { info } = useFiscalStatus();
  if (!info || info.environment === "PRODUCAO") return null;
  const mock = info.environment === "MOCK";
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium",
        mock
          ? "border-violet-400/40 bg-violet-500/10 text-violet-900 dark:text-violet-200"
          : "border-amber-400/50 bg-amber-400/15 text-amber-900 dark:text-amber-200",
        className
      )}
    >
      {mock ? <FlaskConical className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
      <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-xs font-bold tracking-wide dark:bg-white/10">
        {mock ? "SIMULADO" : "HOMOLOGAÇÃO"}
      </span>
      <span>
        {mock
          ? "QA local: a ForeCast é simulada e nada é enviado à SEFAZ."
          : "Ambiente de teste da SEFAZ: as notas emitidas aqui não têm valor fiscal."}
      </span>
      {!info.configured && (
        <span className="font-semibold">Emissão ainda não configurada no servidor.</span>
      )}
    </div>
  );
}
