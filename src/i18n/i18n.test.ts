import { describe, expect, it } from 'vitest'
import { createI18n } from '.'
import { en } from './en'
import { pl } from './pl'
import { pluralPl } from './plural'

describe('pluralPl', () => {
  const trees = (n: number) => pluralPl(n, 'drzewo', 'drzewa', 'drzew')

  it('follows Polish rules, including the teens', () => {
    expect([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 102, 112].map(trees)).toEqual([
      'drzewo', 'drzewa', 'drzewa', 'drzew', 'drzew', 'drzew', 'drzew', 'drzew', 'drzewa', 'drzew', 'drzewa', 'drzew',
    ])
  })
})

/** Walks both dictionaries in parallel and reports every structural difference. */
function compare(a: unknown, b: unknown, path: string, problems: string[]): void {
  if (typeof a !== typeof b) {
    problems.push(`${path}: ${typeof a} vs ${typeof b}`)
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) problems.push(`${path}: ${a.length} items vs ${b.length}`)
    a.forEach((item, i) => compare(item, b[i], `${path}[${i}]`, problems))
  } else if (typeof a === 'function' && typeof b === 'function') {
    if (a.length !== b.length) problems.push(`${path}: takes ${a.length} args vs ${b.length}`)
  } else if (a && b && typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b as object)])
    for (const k of keys) compare((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`, problems)
  } else if (typeof b === 'string' && b.trim() === '') {
    problems.push(`${path}: empty`)
  }
}

/** Messages whose arguments aren't all numbers or strings. */
const SAMPLE_ARGS: Record<string, unknown[]> = { 'messages.stats.delta': [20, 'week', true] }

/** Calls every message function with plausible arguments to make sure none throws or returns nothing. */
function render(value: unknown, path: string, out: string[]): void {
  if (typeof value === 'function') {
    const result = value(...(SAMPLE_ARGS[path] ?? Array(value.length).fill(3)))
    if (typeof result !== 'string' || !result.trim()) out.push(path)
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) render(v, `${path}.${k}`, out)
  }
}

describe('dictionaries', () => {
  it('Polish has exactly the same shape as English', () => {
    const problems: string[] = []
    compare(en, pl, 'messages', problems)
    expect(problems).toEqual([])
  })

  it('every message renders to text', () => {
    for (const dict of [en, pl]) {
      const broken: string[] = []
      render(dict, 'messages', broken)
      expect(broken).toEqual([])
    }
  })
})

describe('formatting', () => {
  const en18 = createI18n('en')
  const pl18 = createI18n('pl')
  const MIN = 60_000

  it('formats durations per language', () => {
    expect(en18.duration(85 * MIN)).toBe('1h 25m')
    expect(pl18.duration(85 * MIN)).toBe('1 h 25 min')
    expect(pl18.duration(25 * MIN)).toBe('25 min')
    expect(pl18.axisDuration(90 * MIN)).toBe('1,5 h')
    expect(en18.axisDuration(90 * MIN)).toBe('1.5h')
  })

  it('uses standalone Polish month names and Polish weekdays', () => {
    const oct = new Date(2026, 9, 20)
    expect(pl18.periodLabel('month', oct)).toBe('Październik 2026')
    expect(en18.periodLabel('month', oct)).toBe('October 2026')
    expect(pl18.date(oct, 'EEEE, d MMM')).toBe('wtorek, 20 paź')
    expect(pl18.cap(pl18.date(oct, 'EEEE, d MMM'))).toBe('Wtorek, 20 paź')
  })

  it('pluralises in context', () => {
    expect(pl18.t.forest.trees(1)).toBe('1 drzewo')
    expect(pl18.t.forest.trees(3)).toBe('3 drzewa')
    expect(pl18.t.forest.trees(5)).toBe('5 drzew')
    expect(en18.t.forest.trees(1)).toBe('1 tree')
    expect(pl18.t.stats.days(2)).toBe('2 dni')
  })
})
