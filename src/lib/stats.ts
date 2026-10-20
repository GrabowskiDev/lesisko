import { addDays, addHours, addMonths, startOfDay } from 'date-fns'
import { periodRange, type Period, type Range } from './time'
import type { Session } from '../types'

export function focusMs(s: Session): number {
  return s.status === 'completed' ? Math.max(0, s.end - s.start) : 0
}

/** Focused time of `s` that falls inside [start, end). */
export function overlapMs(s: Session, range: Range): number {
  if (s.status !== 'completed') return 0
  return Math.max(0, Math.min(s.end, range.end) - Math.max(s.start, range.start))
}

export function totalFocus(sessions: Session[], range: Range): number {
  return sessions.reduce((sum, s) => sum + overlapMs(s, range), 0)
}

/** Sessions that overlap the range at all, oldest first. */
export function sessionsInRange(sessions: Session[], range: Range): Session[] {
  return sessions
    .filter((s) => s.start < range.end && s.end > range.start)
    .sort((a, b) => a.start - b.start)
}

export interface Bucket extends Range {
  ms: number
}

/** Splits a period into chart buckets: hours of a day, days of a week/month, months of a year. */
export function buckets(period: Period, anchor: Date, sessions: Session[]): Bucket[] {
  const { start, end } = periodRange(period, anchor)
  const out: Bucket[] = []
  let cursor = new Date(start)
  while (+cursor < end) {
    const next =
      period === 'day' ? addHours(cursor, 1)
      : period === 'year' ? addMonths(cursor, 1)
      : addDays(cursor, 1)
    const range = { start: +cursor, end: +next }
    out.push({ ...range, ms: totalFocus(sessions, range) })
    cursor = next
  }
  return out
}

export interface TagTotal {
  tagId: string | null
  ms: number
}

export function totalsByTag(sessions: Session[], range: Range): TagTotal[] {
  const map = new Map<string | null, number>()
  for (const s of sessions) {
    const ms = overlapMs(s, range)
    if (ms > 0) map.set(s.tagId, (map.get(s.tagId) ?? 0) + ms)
  }
  return [...map].map(([tagId, ms]) => ({ tagId, ms })).sort((a, b) => b.ms - a.ms)
}

/**
 * Consecutive days with any focus, counting back from today. A day without focus
 * yet doesn't break the streak until it is over, so we start from yesterday then.
 */
export function currentStreak(sessions: Session[], now = new Date()): number {
  const days = new Set<number>()
  for (const s of sessions) {
    if (focusMs(s) > 0) days.add(+startOfDay(s.start))
  }
  let day = startOfDay(now)
  if (!days.has(+day)) day = addDays(day, -1)
  let streak = 0
  while (days.has(+day)) {
    streak++
    day = addDays(day, -1)
  }
  return streak
}
