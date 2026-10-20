import {
  addDays, addMonths, addWeeks, addYears, endOfDay, endOfMonth, endOfWeek, endOfYear,
  format, startOfDay, startOfMonth, startOfWeek, startOfYear,
} from 'date-fns'

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE

export type Period = 'day' | 'week' | 'month' | 'year'

const WEEK = { weekStartsOn: 1 } as const

/** "24:59" or "1:02:03". */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** 24-hour "14:05" — the same in every supported language. */
export function formatTime(ms: number): string {
  return format(ms, 'HH:mm')
}

export interface Range {
  start: number
  end: number
}

export function periodRange(period: Period, anchor: Date): Range {
  switch (period) {
    case 'day': return { start: +startOfDay(anchor), end: +endOfDay(anchor) + 1 }
    case 'week': return { start: +startOfWeek(anchor, WEEK), end: +endOfWeek(anchor, WEEK) + 1 }
    case 'month': return { start: +startOfMonth(anchor), end: +endOfMonth(anchor) + 1 }
    case 'year': return { start: +startOfYear(anchor), end: +endOfYear(anchor) + 1 }
  }
}

export function shiftAnchor(period: Period, anchor: Date, dir: 1 | -1): Date {
  switch (period) {
    case 'day': return addDays(anchor, dir)
    case 'week': return addWeeks(anchor, dir)
    case 'month': return addMonths(anchor, dir)
    case 'year': return addYears(anchor, dir)
  }
}

/** Value for <input type="date">, in local time. */
export function toDateInput(ms: number): string {
  return format(ms, 'yyyy-MM-dd')
}

/** Value for <input type="time">, in local time. */
export function toTimeInput(ms: number): string {
  return format(ms, 'HH:mm')
}

export function fromDateTimeInputs(date: string, time: string): number {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return +new Date(y, mo - 1, d, h, mi)
}
