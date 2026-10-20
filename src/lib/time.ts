import {
  addDays, addMonths, addWeeks, addYears, endOfDay, endOfMonth, endOfWeek, endOfYear,
  format, isSameDay, startOfDay, startOfMonth, startOfWeek, startOfYear,
} from 'date-fns'

export const MINUTE = 60_000
export const HOUR = 60 * MINUTE

export type Period = 'day' | 'week' | 'month' | 'year'

const WEEK = { weekStartsOn: 1 } as const

/** "1h 25m", "25m", "0m". */
export function formatDuration(ms: number): string {
  const totalMin = Math.floor(Math.max(0, ms) / MINUTE)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

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

export function periodLabel(period: Period, anchor: Date, now = new Date()): string {
  switch (period) {
    case 'day':
      if (isSameDay(anchor, now)) return 'Today'
      if (isSameDay(anchor, addDays(now, -1))) return 'Yesterday'
      return format(anchor, 'EEE, d MMM yyyy')
    case 'week': {
      const { start, end } = periodRange('week', anchor)
      return `${format(start, 'd MMM')} – ${format(end - 1, 'd MMM yyyy')}`
    }
    case 'month': return format(anchor, 'MMMM yyyy')
    case 'year': return format(anchor, 'yyyy')
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
