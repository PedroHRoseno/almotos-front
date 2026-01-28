/**
 * Máscaras e formatadores para campos de formulário.
 */

/** Remove tudo que não for dígito. */
export function digitsOnly(s: string): string {
  return (s || "").replace(/\D/g, "");
}

/** Formato placa LLL-NNNN (ex.: KIU-1437). Letras em maiúsculas, hífen após a 3ª letra. */
export function formatLicensePlate(value: string): string {
  const v = (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (v.length <= 3) {
    return v.replace(/[^A-Z]/g, "");
  }
  const letters = v.slice(0, 3).replace(/[^A-Z]/g, "");
  const rest = v.slice(3).replace(/\D/g, "").slice(0, 4);
  return rest.length > 0 ? `${letters}-${rest}` : letters;
}

/** Valor da placa apenas com letras/números (para envio à API), ex.: KIU1437 ou KIU-1437 → padrão aceito pelo backend. */
export function normalizeLicensePlate(value: string): string {
  const s = (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length >= 7 ? `${s.slice(0, 3)}-${s.slice(3, 7)}` : s;
}

/** Máscara dinâmica CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) conforme quantidade de dígitos. */
export function formatDocument(value: string): string {
  const d = digitsOnly(value || "");
  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  }
  const cnpj = d.slice(0, 14);
  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
}

/** Valida documento: 11 (CPF) ou 14 (CNPJ) dígitos. */
export function isValidDocument(value: string): boolean {
  const d = digitsOnly(value || "");
  return d.length === 11 || d.length === 14;
}
