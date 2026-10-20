const plRules = new Intl.PluralRules('pl')

/** English: 1 tree, 2 trees. */
export function pluralEn(n: number, one: string, other: string): string {
  return n === 1 ? one : other
}

/**
 * Polish has three forms for whole numbers: 1 drzewo, 2–4 drzewa (but 12–14 drzew),
 * 5+ drzew. Fractions use the "few" form (1,5 godziny).
 */
export function pluralPl(n: number, one: string, few: string, many: string): string {
  switch (plRules.select(n)) {
    case 'one': return one
    case 'few': return few
    case 'many': return many
    default: return few
  }
}
