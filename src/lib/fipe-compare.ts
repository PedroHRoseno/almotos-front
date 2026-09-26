/** Faixa em que o preço da loja é tratado como alinhado à FIPE (±3%). */
export const FIPE_BAND = 3;

export type FipeTone = "below" | "aligned" | "above";

export type FipeComparison = {
  percentage: number;
  savings: number;
  tone: FipeTone;
};

export function compareFipe(
  suggested: number | null | undefined,
  fipe: number | null | undefined
): FipeComparison | null {
  if (
    suggested == null ||
    fipe == null ||
    fipe <= 0 ||
    Number.isNaN(suggested) ||
    Number.isNaN(fipe)
  ) {
    return null;
  }
  const percentage = ((suggested - fipe) / fipe) * 100;
  const savings = fipe - suggested;
  const tone: FipeTone =
    percentage <= -FIPE_BAND ? "below" : percentage > FIPE_BAND ? "above" : "aligned";
  return { percentage, savings, tone };
}

export function formatFipePercent(percentage: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(percentage));
}
