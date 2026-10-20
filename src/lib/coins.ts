import { MINUTE } from './time'
import type { Purchase, Session, SessionSource, SessionStatus } from '../types'

/** One coin per full minute of successful focus. */
export function coinsFor(
  durationMs: number,
  status: SessionStatus,
  source: SessionSource,
  manualEarnsCoins: boolean,
): number {
  if (status !== 'completed') return 0
  if (source === 'manual' && !manualEarnsCoins) return 0
  return Math.floor(Math.max(0, durationMs) / MINUTE)
}

export function coinBalance(sessions: Pick<Session, 'coins'>[], purchases: Pick<Purchase, 'price'>[]): number {
  const earned = sessions.reduce((sum, s) => sum + s.coins, 0)
  const spent = purchases.reduce((sum, p) => sum + p.price, 0)
  return earned - spent
}
