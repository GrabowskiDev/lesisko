import Dexie, { type EntityTable } from 'dexie'
import { detectLanguage } from './i18n/detect'
import { DEFAULT_SETTINGS, type Purchase, type Session, type Settings, type Tag } from './types'

interface KV {
  key: string
  value: unknown
}

export const db = new Dexie('lesisko') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  tags: EntityTable<Tag, 'id'>
  purchases: EntityTable<Purchase, 'itemId'>
  kv: EntityTable<KV, 'key'>
}

db.version(1).stores({
  sessions: 'id, start, tagId, status, source',
  tags: 'id, name',
  purchases: 'itemId',
  kv: 'key',
})

export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get('settings')
  return { ...DEFAULT_SETTINGS, language: detectLanguage(), ...(row?.value as Partial<Settings> | undefined) }
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db.transaction('rw', db.kv, async () => {
    const current = await getSettings()
    await db.kv.put({ key: 'settings', value: { ...current, ...patch } })
  })
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}
