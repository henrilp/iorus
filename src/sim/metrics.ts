/** Indice de Gini : 0 = égalité parfaite, 1 = une personne a tout. */
export function gini(values: readonly number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  const sorted = [...values].map((x) => Math.max(0, x)).sort((a, b) => a - b);
  const total = sorted.reduce((s, x) => s + x, 0);
  if (total === 0) return 0;
  let weighted = 0;
  sorted.forEach((x, i) => {
    weighted += (i + 1) * x;
  });
  return (2 * weighted) / (n * total) - (n + 1) / n;
}

/** Parts de la population dans 10 tranches de 0,1 (la dernière inclut 1). */
export function bins10(values: readonly number[]): number[] {
  const counts = new Array<number>(10).fill(0);
  for (const x of values) counts[Math.min(9, Math.max(0, Math.floor(x * 10)))]! += 1;
  return values.length === 0 ? counts : counts.map((c) => c / values.length);
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, x) => s + x, 0) / values.length;
}
