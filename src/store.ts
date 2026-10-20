import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings, newId } from './db'
import { coinBalance, coinsFor } from './lib/coins'
import { getTheme, TAG_COLORS } from './data/themes'
import { DEFAULT_SETTINGS, type Purchase, type Session, type Settings, type Tag } from './types'

// ---- hooks ----------------------------------------------------------------

export function useSettings(): Settings {
  return useLiveQuery(getSettings, [], DEFAULT_SETTINGS)
}

export function useDark(): boolean {
  return getTheme(useSettings().themeId).dark
}

export function useSessions(): Session[] {
  return useLiveQuery(() => db.sessions.orderBy('start').toArray(), [], [])
}

export function useTags(): Tag[] {
  return useLiveQuery(() => db.tags.toArray(), [], [])
}

export function usePurchases(): Purchase[] {
  return useLiveQuery(() => db.purchases.toArray(), [], [])
}

export function useCoins(): number {
  return useLiveQuery(
    async () => coinBalance(await db.sessions.toArray(), await db.purchases.toArray()),
    [],
    0,
  )
}

/** Whether a shop item (species or theme) can be used: free items are always owned. */
export function useOwns(): (item: { id: string; price: number }) => boolean {
  const purchases = usePurchases()
  const bought = new Set(purchases.map((p) => p.itemId))
  return (item) => item.price === 0 || bought.has(item.id)
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
