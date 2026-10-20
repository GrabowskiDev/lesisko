import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings, newId } from './db'
import { coinBalance, coinsFor } from './lib/coins'
import { getTheme, TAG_COLORS } from './data/themes'
import type { Purchase, Session, Settings, Tag } from './types'

// ---- data provider --------------------------------------------------------

interface AppData {
  settings: Settings
  sessions: Session[]
  tags: Tag[]
  purchases: Purchase[]
}

const DataContext = createContext<AppData | null>(null)

/**
 * Loads everything once and keeps it live. Nothing renders until the first load is done,
 * so screens never see placeholder values (a coin balance of 0, default settings, …).
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const settings = useLiveQuery(getSettings)
  const sessions = useLiveQuery(() => db.sessions.orderBy('start').toArray())
  const tags = useLiveQuery(() => db.tags.toArray())
  const purchases = useLiveQuery(() => db.purchases.toArray())
  const data = useMemo(
    () => (settings && sessions && tags && purchases ? { settings, sessions, tags, purchases } : null),
    [settings, sessions, tags, purchases],
  )
  if (!data) return null
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>
}

function useData(): AppData {
  const data = useContext(DataContext)
  if (!data) throw new Error('useData() needs a <DataProvider> above it')
  return data
}

// ---- hooks ----------------------------------------------------------------

export function useSettings(): Settings {
  return useData().settings
}

export function useDark(): boolean {
  return getTheme(useSettings().themeId).dark
}

/** All sessions, oldest first. */
export function useSessions(): Session[] {
  return useData().sessions
}

export function useTags(): Tag[] {
  return useData().tags
}

export function useCoins(): number {
  const { sessions, purchases } = useData()
  return useMemo(() => coinBalance(sessions, purchases), [sessions, purchases])
}

/** Whether a shop item (species or theme) can be used: free items are always owned. */
export function useOwns(): (item: { id: string; price: number }) => boolean {
  const { purchases } = useData()
  return useMemo(() => {
    const bought = new Set(purchases.map((p) => p.itemId))
    return (item) => item.price === 0 || bought.has(item.id)
  }, [purchases])
}

export function tagColor(tag: Tag | undefined, dark: boolean): string {
  if (!tag) return dark ? '#7f8e78' : '#8b937f'
  const c = TAG_COLORS[tag.color % TAG_COLORS.length]
  return dark ? c.dark : c.light
}

// ---- sessions -------------------------------------------------------------

export type SessionDraft = Omit<Session, 'id' | 'coins'> & { id?: string }

export async function saveSession(draft: SessionDraft): Promise<Session> {
  const settings = await getSettings()
  const session: Session = {
    ...draft,
    id: draft.id ?? newId(),
    coins: coinsFor(draft.end - draft.start, draft.status, draft.source, settings.manualEarnsCoins),
  }
  await db.sessions.put(session)
  return session
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id)
}

// ---- tags -----------------------------------------------------------------

export async function createTag(name: string): Promise<Tag> {
  const existing = await db.tags.toArray()
  const tag: Tag = { id: newId(), name: name.trim(), color: existing.length % TAG_COLORS.length }
  await db.tags.add(tag)
  return tag
}

export async function updateTag(id: string, patch: Partial<Tag>): Promise<void> {
  await db.tags.update(id, patch)
}

/** Deletes the tag; its sessions become untagged. */
export async function deleteTag(id: string): Promise<void> {
  await db.transaction('rw', db.tags, db.sessions, db.kv, async () => {
    await db.sessions.where('tagId').equals(id).modify({ tagId: null })
    await db.tags.delete(id)
    const settings = await getSettings()
    if (settings.tagId === id) await db.kv.put({ key: 'settings', value: { ...settings, tagId: null } })
  })
}

// ---- shop -----------------------------------------------------------------

export class NotEnoughCoins extends Error {}

export async function buy(itemId: string, price: number): Promise<void> {
  await db.transaction('rw', db.sessions, db.purchases, async () => {
    if (await db.purchases.get(itemId)) return
    const balance = coinBalance(await db.sessions.toArray(), await db.purchases.toArray())
    if (balance < price) throw new NotEnoughCoins()
    await db.purchases.add({ itemId, price, purchasedAt: Date.now() })
  })
}
