import { db, getSettings, newId } from '../db'
import { SPECIES } from '../data/species'
import { en } from '../i18n/en'
import { TAG_COLORS } from '../data/themes'
import { coinsFor } from './coins'
import type { ForestRow } from './forestCsv'
import type { Purchase, Session, Settings, Tag } from '../types'

export interface Backup {
  app: 'better-forest'
  version: 1
  exportedAt: number
  sessions: Session[]
  tags: Tag[]
  purchases: Purchase[]
  /** Missing in hand-edited backups; settings are left alone then. */
  settings?: Settings
}

export async function createBackup(): Promise<Backup> {
  return {
    app: 'better-forest',
    version: 1,
    exportedAt: Date.now(),
    sessions: await db.sessions.toArray(),
    tags: await db.tags.toArray(),
    purchases: await db.purchases.toArray(),
    settings: await getSettings(),
  }
}

export class BackupError extends Error {
  constructor(readonly code: 'invalidJson' | 'notBackup') {
    super(code)
  }
}

export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('invalidJson')
  }
  const b = data as Partial<Backup>
  if (b?.app !== 'better-forest' || !Array.isArray(b.sessions) || !Array.isArray(b.tags)) {
    throw new BackupError('notBackup')
  }
  return { ...b, purchases: b.purchases ?? [] } as Backup
}

/** Replaces everything in the database with the backup's contents. */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', db.sessions, db.tags, db.purchases, db.kv, async () => {
    await Promise.all([db.sessions.clear(), db.tags.clear(), db.purchases.clear()])
    await db.sessions.bulkPut(backup.sessions)
    await db.tags.bulkPut(backup.tags)
    await db.purchases.bulkPut(backup.purchases)
    if (backup.settings) await db.kv.put({ key: 'settings', value: backup.settings })
  })
}

/** Share sheet on iOS (so it can go to Files / iCloud Drive), plain download elsewhere. */
export async function shareOrDownload(filename: string, content: string, type: string): Promise<void> {
  const file = new File([content], filename, { type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      // Fall through to a regular download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export interface ForestImportSummary {
  added: number
  updated: number
  newTags: string[]
}

/** Forest exports English tree names, so match against ours in English. */
function matchSpecies(treeType: string | null): string {
  if (!treeType) return 'oak'
  const t = treeType.toLowerCase()
  return SPECIES.find((s) => t.includes(s.id) || t.includes(en.species[s.id].name.toLowerCase()))?.id ?? 'oak'
}

/**
 * Imports parsed Forest rows. Ids are derived from the start/end times so importing the
 * same file twice updates rather than duplicates.
 */
export async function importForestRows(rows: ForestRow[]): Promise<ForestImportSummary> {
  const settings = await getSettings()
  return db.transaction('rw', db.sessions, db.tags, async () => {
    const tags = await db.tags.toArray()
    const byName = new Map(tags.map((t) => [t.name.toLowerCase(), t]))
    const newTags: string[] = []

    const tagIdFor = (name: string | null): string | null => {
      if (!name) return null
      const key = name.toLowerCase()
      let tag = byName.get(key)
      if (!tag) {
        tag = { id: newId(), name, color: (tags.length + newTags.length) % TAG_COLORS.length }
        byName.set(key, tag)
        newTags.push(name)
      }
      return tag.id
    }

    const sessions: Session[] = rows.map((r) => {
      const status = r.success ? 'completed' : 'withered'
      return {
        id: `forest-${r.start}-${r.end}`,
        start: r.start,
        end: r.end,
        status,
        source: 'import',
        speciesId: matchSpecies(r.treeType),
        tagId: tagIdFor(r.tag),
        note: r.note ?? undefined,
        coins: coinsFor(r.end - r.start, status, 'import', settings.manualEarnsCoins),
      }
    })

    const existing = new Set(
      (await db.sessions.bulkGet(sessions.map((s) => s.id))).filter(Boolean).map((s) => s!.id),
    )
    await db.tags.bulkAdd([...byName.values()].filter((t) => newTags.includes(t.name)))
    await db.sessions.bulkPut(sessions)
    return { added: sessions.length - existing.size, updated: existing.size, newTags }
  })
}
