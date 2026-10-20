export type SessionStatus = 'completed' | 'withered'
export type SessionSource = 'timer' | 'manual' | 'import'
export type TimerMode = 'countdown' | 'stopwatch'

export interface Session {
  id: string
  /** Epoch ms. */
  start: number
  /** Epoch ms. For withered sessions this is when the tree died. */
  end: number
  status: SessionStatus
  source: SessionSource
  speciesId: string
  tagId: string | null
  note?: string
  /** Coins awarded for this session, fixed when it was saved. */
  coins: number
}

export interface Tag {
  id: string
  name: string
  /** Index into TAG_COLORS. */
  color: number
}

export interface Purchase {
  itemId: string
  price: number
  purchasedAt: number
}

export type PenaltyMode = 'off' | 'ask' | 'strict'
export type Language = 'en' | 'pl'

export interface Settings {
  language: Language
  penaltyMode: PenaltyMode
  /** Time away that is always forgiven, in seconds. */
  graceSeconds: number
  /** In strict mode, being away longer than this kills the tree. */
  strictMinutes: number
  dailyGoalMinutes: number
  manualEarnsCoins: boolean
  defaultMinutes: number
  timerMode: TimerMode
  speciesId: string
  tagId: string | null
  themeId: string
  sound: boolean
  lastBackupAt: number | null
}

/** `language` is replaced by the device language on first run (see db.getSettings). */
export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  penaltyMode: 'ask',
  graceSeconds: 10,
  strictMinutes: 2,
  dailyGoalMinutes: 120,
  manualEarnsCoins: true,
  defaultMinutes: 25,
  timerMode: 'countdown',
  speciesId: 'oak',
  tagId: null,
  themeId: 'meadow',
  sound: true,
  lastBackupAt: null,
}

/** A session that is currently running. Lives in localStorage (see activeSession.ts). */
export interface ActiveSession {
  start: number
  mode: TimerMode
  /** Planned length for countdown mode. */
  plannedMinutes: number
  speciesId: string
  tagId: string | null
  /** Set when the app is hidden; cleared when we come back and resolve the absence. */
  hiddenAt?: number
}
