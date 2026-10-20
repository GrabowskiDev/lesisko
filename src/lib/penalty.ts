import { MINUTE } from './time'
import type { ActiveSession, Settings } from '../types'

export type AbsenceVerdict = 'continue' | 'ask' | 'wither'

export function plannedEnd(active: ActiveSession): number | null {
  return active.mode === 'countdown' ? active.start + active.plannedMinutes * MINUTE : null
}

/**
 * How long the user was away while the tree was still growing. Time away after a
 * countdown already finished doesn't count against them.
 */
export function awayMs(active: ActiveSession, now: number): number {
  if (active.hiddenAt == null) return 0
  const end = plannedEnd(active)
  const until = end == null ? now : Math.min(now, end)
  return Math.max(0, until - active.hiddenAt)
}

/**
 * A web app can't tell "locked the phone" from "switched to another app" — both just
 * hide the page. So short absences are always forgiven, and longer ones are either
 * ignored, asked about, or (strict mode) punished past a limit.
 */
export function judgeAbsence(active: ActiveSession, now: number, settings: Settings): AbsenceVerdict {
  const away = awayMs(active, now)
  if (settings.penaltyMode === 'off' || away <= settings.graceSeconds * 1000) return 'continue'
  if (settings.penaltyMode === 'strict') {
    return away > settings.strictMinutes * MINUTE ? 'wither' : 'continue'
  }
  return 'ask'
}
