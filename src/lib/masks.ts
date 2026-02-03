/**
 * Máscaras e formatadores para campos de formulário.
 */

/** Remove tudo que não for dígito. */
export function digitsOnly(s: string): string {
  return (s || "").replace(/\D/g, "");
}

/**
 * Formato placa fixo LLL-XXXX (8 caracteres).
 * Tradicional: AAA-9999 | Mercosul: AAA-1A11
 * Posições 0–2: apenas letras (A–Z)
 * Posição 3: hífen fixo (-)
 * Posição 4: apenas número (0–9)
 * Posição 5: letra (A–Z) ou número (0–9) — Mercosul
 * Posições 6–7: apenas números (0–9)
 * Letras convertidas para maiúsculas.
 */
export function formatLicensePlate(value: string): string {
  const raw = (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letters = raw.slice(0, 3).replace(/[^A-Z]/g, "");
  if (letters.length < 3) return letters;
  const after = raw.slice(3);
  if (after.length === 0) return letters;
  let idx = 0;
  const takeDigit = () => {
    while (idx < after.length && !/[0-9]/.test(after[idx])) idx++;
    return idx < after.length ? after[idx++] : "";
  };
  const takeAny = () => (idx < after.length ? after[idx++] : "");
  const p4 = takeDigit();
  const p5 = takeAny();
  const p6 = takeDigit();
  const p7 = takeDigit();
  const rest = p4 + p5 + p6 + p7;
  return rest ? `${letters}-${rest}` : letters;
}

/** Placa formatada para envio à API: LLL-XXXX (tradicional ou Mercosul). */
export function normalizeLicensePlate(value: string): string {
  const s = (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length < 7) return s.length ? `${s.slice(0, 3)}-${s.slice(3)}` : s;
  return `${s.slice(0, 3)}-${s.slice(3, 7)}`;
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
