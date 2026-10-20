import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { BackupError, createBackup, importForestRows, parseBackup, restoreBackup } from './backup'

const row = (h: number, tag: string | null, success = true) => ({
  start: +new Date(2026, 0, 1, h),
  end: +new Date(2026, 0, 1, h, 30),
  tag,
  note: null,
  treeType: 'Cherry Blossom',
  success,
})

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('importForestRows', () => {
  it('creates tags once and does not duplicate on re-import', async () => {
    const rows = [row(9, 'Math'), row(11, 'math'), row(13, null, false)]
    const first = await importForestRows(rows)
    expect(first).toEqual({ added: 3, updated: 0, newTags: ['Math'] })

    const second = await importForestRows(rows)
    expect(second).toEqual({ added: 0, updated: 3, newTags: [] })
    expect(await db.sessions.count()).toBe(3)
    expect(await db.tags.count()).toBe(1)

    const sessions = await db.sessions.orderBy('start').toArray()
    expect(sessions.map((s) => [s.status, s.coins, s.speciesId])).toEqual([
      ['completed', 30, 'cherry'],
      ['completed', 30, 'cherry'],
      ['withered', 0, 'cherry'],
    ])
  })
})

describe('backup round trip', () => {
  it('restores exactly what was exported, replacing current data', async () => {
    await importForestRows([row(9, 'Math')])
    await db.purchases.add({ itemId: 'birch', price: 150, purchasedAt: 1 })
    const backup = parseBackup(JSON.stringify(await createBackup()))

    await importForestRows([row(15, 'Physics')])
    await restoreBackup(backup)

    expect(await db.sessions.count()).toBe(1)
    expect((await db.tags.toArray()).map((t) => t.name)).toEqual(['Math'])
    expect(await db.purchases.count()).toBe(1)
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow(new BackupError('notBackup'))
    expect(() => parseBackup('nope')).toThrow(new BackupError('invalidJson'))
  })
})
