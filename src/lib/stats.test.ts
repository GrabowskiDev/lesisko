import { describe, expect, it } from 'vitest'
import { buckets, currentStreak, totalFocus, totalsByTag } from './stats'
import { coinBalance, coinsFor } from './coins'
import { periodRange } from './time'
import type { Session } from '../types'

const at = (d: number, h: number, m = 0) => +new Date(2026, 9, d, h, m)
const session = (start: number, end: number, extra: Partial<Session> = {}): Session => ({
  id: String(start), start, end, status: 'completed', source: 'timer', speciesId: 'oak', tagId: null, coins: 0, ...extra,
})

describe('stats', () => {
  const sessions = [
    session(at(19, 9), at(19, 10), { tagId: 'math' }),
    session(at(19, 23, 30), at(20, 0, 30), { tagId: 'math' }), // crosses midnight
    session(at(20, 14), at(20, 14, 45), { source: 'manual', tagId: 'cs' }),
    session(at(20, 15), at(20, 15, 20), { status: 'withered' }),
  ]

  it('splits sessions that cross period boundaries', () => {
    expect(totalFocus(sessions, periodRange('day', new Date(2026, 9, 19)))).toBe(90 * 60_000)
    expect(totalFocus(sessions, periodRange('day', new Date(2026, 9, 20)))).toBe(75 * 60_000)
  })

  it('ignores withered trees and counts manual sessions', () => {
    const week = periodRange('week', new Date(2026, 9, 20))
    expect(totalFocus(sessions, week)).toBe(165 * 60_000)
  })

  it('buckets a day by hour and a week by day', () => {
    const hours = buckets('day', new Date(2026, 9, 19), sessions)
    expect(hours).toHaveLength(24)
    expect(hours[9].ms).toBe(60 * 60_000)
    expect(hours[23].ms).toBe(30 * 60_000)

    const days = buckets('week', new Date(2026, 9, 20), sessions)
    expect(days).toHaveLength(7)
    expect(new Date(days[0].start).getDay()).toBe(1) // weeks start on Monday
  })

  it('totals by tag, largest first', () => {
    const week = periodRange('week', new Date(2026, 9, 20))
    expect(totalsByTag(sessions, week)).toEqual([
      { tagId: 'math', ms: 120 * 60_000 },
      { tagId: 'cs', ms: 45 * 60_000 },
    ])
  })

  it('keeps the streak alive until today is over', () => {
    expect(currentStreak(sessions, new Date(2026, 9, 20, 18))).toBe(2)
    expect(currentStreak(sessions, new Date(2026, 9, 21, 8))).toBe(2)
    expect(currentStreak(sessions, new Date(2026, 9, 22, 8))).toBe(0)
  })
})

describe('coins', () => {
  it('pays a coin per full minute of completed focus', () => {
    expect(coinsFor(25.9 * 60_000, 'completed', 'timer', true)).toBe(25)
    expect(coinsFor(25 * 60_000, 'withered', 'timer', true)).toBe(0)
  })

  it('respects the manual-coins setting', () => {
    expect(coinsFor(60 * 60_000, 'completed', 'manual', false)).toBe(0)
    expect(coinsFor(60 * 60_000, 'completed', 'manual', true)).toBe(60)
  })

  it('subtracts purchases from the balance', () => {
    expect(coinBalance([{ coins: 100 }, { coins: 50 }], [{ price: 120 }])).toBe(30)
  })
})
