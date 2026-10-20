import { describe, expect, it } from 'vitest'
import { awayMs, judgeAbsence } from './penalty'
import { DEFAULT_SETTINGS, type ActiveSession } from '../types'

const MIN = 60_000
const start = 1_000_000
const countdown = (hiddenAt?: number): ActiveSession => ({
  start, mode: 'countdown', plannedMinutes: 25, speciesId: 'oak', tagId: null, hiddenAt,
})

describe('awayMs', () => {
  it('only counts time away while the tree was still growing', () => {
    // Hidden at minute 20, back at minute 60: only 5 minutes were before the end.
    expect(awayMs(countdown(start + 20 * MIN), start + 60 * MIN)).toBe(5 * MIN)
  })

  it('counts everything for stopwatches', () => {
    const s: ActiveSession = { ...countdown(start + 20 * MIN), mode: 'stopwatch' }
    expect(awayMs(s, start + 60 * MIN)).toBe(40 * MIN)
  })
})

describe('judgeAbsence', () => {
  const back = (secondsAway: number) => start + 5 * MIN + secondsAway * 1000
  const s = countdown(start + 5 * MIN)

  it('forgives anything when off', () => {
    expect(judgeAbsence(s, back(600), { ...DEFAULT_SETTINGS, penaltyMode: 'off' })).toBe('continue')
  })

  it('forgives absences within the grace period', () => {
    expect(judgeAbsence(s, back(10), { ...DEFAULT_SETTINGS, penaltyMode: 'ask', graceSeconds: 10 })).toBe('continue')
    expect(judgeAbsence(s, back(11), { ...DEFAULT_SETTINGS, penaltyMode: 'ask', graceSeconds: 10 })).toBe('ask')
  })

  it('withers in strict mode only past the limit', () => {
    const strict = { ...DEFAULT_SETTINGS, penaltyMode: 'strict' as const, strictMinutes: 2 }
    expect(judgeAbsence(s, back(90), strict)).toBe('continue')
    expect(judgeAbsence(s, back(121), strict)).toBe('wither')
  })

  it('does nothing when the app was never hidden', () => {
    expect(judgeAbsence(countdown(), start + 60 * MIN, DEFAULT_SETTINGS)).toBe('continue')
  })
})
