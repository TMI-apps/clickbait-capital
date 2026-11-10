/** Dutch number formatting for the score HUD mockup ("2,4 mln", "€ 120.000", "+8,2%"). */

const WHOLE = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 });
const ONE_DECIMAL = new Intl.NumberFormat("nl-NL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatCount(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000_000) return `${sign}${ONE_DECIMAL.format(abs / 1_000_000_000)} mld`;
  if (abs >= 1_000_000) return `${sign}${ONE_DECIMAL.format(abs / 1_000_000)} mln`;
  return `${sign}${WHOLE.format(abs)}`;
}

export function formatMoney(value: number): string {
  const sign = value < 0 ? "−" : "";
  return `${sign}€ ${formatCount(Math.abs(value))}`;
}

export function formatSignedMoney(value: number): string {
  return `${value >= 0 ? "+" : "−"}€ ${formatCount(Math.abs(value))}`;
}

export function formatPercent(rate: number): string {
  return `${rate >= 0 ? "+" : "−"}${ONE_DECIMAL.format(Math.abs(rate) * 100)}%`;
}
