import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { db, updateSettings } from '../db'
import { createBackup, importForestRows, parseBackup, restoreBackup, shareOrDownload, type Backup, type ForestImportSummary } from '../lib/backup'
import { parseForestCsv, type ForestParseResult } from '../lib/forestCsv'
import { formatDuration } from '../lib/time'
import { createTag, deleteTag, updateTag, useSessions, useTags } from '../store'
import { TagDot } from '../components/Pickers'
import { Icon, Segmented, Sheet, Toggle } from '../components/ui'
import type { PenaltyMode, Settings, Tag } from '../types'

const PENALTY_HELP: Record<PenaltyMode, string> = {
  off: 'Leaving the app never hurts your tree.',
  ask: 'When you come back after being away, you’ll be asked whether you were still focusing. Locking your phone to study is totally fine.',
  strict: 'Your tree withers if you’re away for longer than the limit below — locked phone or not.',
}

function Stepper({ value, onChange, min, max, step, format: fmt }: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label="Decrease">−</button>
      <span>{fmt(value)}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label="Increase">+</button>
    </div>
  )
}

export function SettingsScreen({ settings }: { settings: Settings }) {
  const set = (patch: Partial<Settings>) => void updateSettings(patch)

  return (
    <div className="screen">
      <header className="top-bar">
        <h1>Settings</h1>
      </header>

      <section className="card settings-group">
        <h2 className="card-title">Leaving the app</h2>
        <Segmented<PenaltyMode>
          value={settings.penaltyMode}
          onChange={(penaltyMode) => set({ penaltyMode })}
          options={[{ value: 'off', label: 'Off' }, { value: 'ask', label: 'Ask me' }, { value: 'strict', label: 'Strict' }]}
        />
        <p className="hint">{PENALTY_HELP[settings.penaltyMode]}</p>
        {settings.penaltyMode !== 'off' && (
          <div className="setting-row">
            <div>
              <strong>Always forgive</strong>
              <p className="hint">Quick peeks shorter than this never count.</p>
            </div>
            <Stepper value={settings.graceSeconds} onChange={(graceSeconds) => set({ graceSeconds })} min={0} max={120} step={5} format={(v) => `${v}s`} />
          </div>
        )}
        {settings.penaltyMode === 'strict' && (
          <div className="setting-row">
            <div>
              <strong>Wither after</strong>
              <p className="hint">Time away before the tree dies.</p>
            </div>
            <Stepper value={settings.strictMinutes} onChange={(strictMinutes) => set({ strictMinutes })} min={1} max={30} step={1} format={(v) => `${v} min`} />
          </div>
        )}
      </section>

      <section className="card settings-group">
        <h2 className="card-title">Goals & rewards</h2>
        <div className="setting-row">
          <div>
            <strong>Daily goal</strong>
          </div>
          <Stepper value={settings.dailyGoalMinutes} onChange={(dailyGoalMinutes) => set({ dailyGoalMinutes })} min={15} max={720} step={15} format={(v) => formatDuration(v * 60_000)} />
        </div>
        <div className="setting-row">
          <div>
            <strong>Logged time earns coins</strong>
            <p className="hint">Applies to sessions you add or edit from now on.</p>
          </div>
          <Toggle checked={settings.manualEarnsCoins} onChange={(manualEarnsCoins) => set({ manualEarnsCoins })} label="Logged time earns coins" />
        </div>
        <div className="setting-row">
          <div>
            <strong>Sound when a tree is done</strong>
          </div>
          <Toggle checked={settings.sound} onChange={(sound) => set({ sound })} label="Sound" />
        </div>
      </section>

      <TagsSection />
      <DataSection settings={settings} />

      <p className="hint center about">Better Forest · your data stays on this device</p>
    </div>
  )
}

function TagsSection() {
  const tags = useTags()
  const [name, setName] = useState('')

  return (
    <section className="card settings-group">
      <h2 className="card-title">Tags</h2>
      {tags.length === 0 && <p className="hint">No tags yet. Tags let you see where your time goes, e.g. “Math” or “Thesis”.</p>}
      {tags.map((t) => <TagRow key={t.id} tag={t} />)}
      <form className="tag-add" onSubmit={(e) => { e.preventDefault(); if (name.trim()) void createTag(name).then(() => setName('')) }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New tag" maxLength={24} />
        <button className="btn small" type="submit" disabled={!name.trim()}><Icon name="plus" size={16} /> Add</button>
      </form>
    </section>
  )
}

function TagRow({ tag }: { tag: Tag }) {
  const [name, setName] = useState(tag.name)
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="tag-row">
      <TagDot tag={tag} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => (name.trim() ? void updateTag(tag.id, { name: name.trim() }) : setName(tag.name))}
        aria-label="Tag name"
        maxLength={24}
      />
      {confirm ? (
        <>
          <button className="btn small" onClick={() => setConfirm(false)}>Keep</button>
          <button className="btn small danger" onClick={() => void deleteTag(tag.id)}>Delete</button>
        </>
      ) : (
        <button className="icon-btn" onClick={() => setConfirm(true)} aria-label={`Delete ${tag.name}`}><Icon name="close" size={18} /></button>
      )}
    </div>
  )
}

function DataSection({ settings }: { settings: Settings }) {
  const sessions = useSessions()
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [forest, setForest] = useState<ForestParseResult | null>(null)
  const [forestDone, setForestDone] = useState<ForestImportSummary | null>(null)
  const [backup, setBackup] = useState<Backup | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [eraseStep, setEraseStep] = useState(0)
  const backupInput = useRef<HTMLInputElement>(null)
  const forestInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted)
  }, [])

  const exportBackup = async () => {
    const data = await createBackup()
    await shareOrDownload(`better-forest-${format(Date.now(), 'yyyy-MM-dd')}.json`, JSON.stringify(data, null, 2), 'application/json')
    await updateSettings({ lastBackupAt: Date.now() })
  }

  const readFile = (input: HTMLInputElement | null, handle: (text: string) => void) => {
    const file = input?.files?.[0]
    if (!file) return
    void file.text().then(handle)
    input.value = ''
  }

  const onBackupFile = () =>
    readFile(backupInput.current, (text) => {
      try {
        setBackup(parseBackup(text))
      } catch (e) {
        setMessage((e as Error).message)
      }
    })

  const onForestFile = () => readFile(forestInput.current, (text) => setForest(parseForestCsv(text)))

  const runForestImport = async () => {
    if (!forest) return
    setForestDone(await importForestRows(forest.rows))
    setForest(null)
  }

  const runRestore = async () => {
    if (!backup) return
    await restoreBackup(backup)
    setBackup(null)
    setMessage(`Restored ${backup.sessions.length} sessions.`)
  }

  const erase = async () => {
    await db.delete()
    location.reload()
  }

  return (
    <section className="card settings-group">
      <h2 className="card-title">Your data</h2>
      <p className="hint">
        Everything is saved on this phone. Deleting the app from your Home Screen (or clearing website data) erases it,
        so export a backup now and then — save it to iCloud Drive from the share sheet.
      </p>
      <p className="hint">
        {settings.lastBackupAt ? `Last backup: ${format(settings.lastBackupAt, 'd MMM yyyy, HH:mm')}` : 'No backup yet.'}
        {persisted != null && (persisted ? ' · Storage is protected from automatic cleanup.' : ' · Storage protection not granted.')}
      </p>

      <button className="btn primary block" onClick={() => void exportBackup()}>Export backup</button>
      <button className="btn block" onClick={() => backupInput.current?.click()}>Restore from backup…</button>
      <button className="btn block" onClick={() => forestInput.current?.click()}>Import from Forest app (CSV)…</button>
      <input ref={backupInput} type="file" accept=".json,application/json" hidden onChange={onBackupFile} />
      <input ref={forestInput} type="file" accept=".csv,text/csv,text/plain" hidden onChange={onForestFile} />

      {eraseStep === 0 ? (
        <button className="btn ghost danger-text block" onClick={() => setEraseStep(1)}>Erase all data…</button>
      ) : (
        <div className="erase-box">
          <p className="warning">This deletes all {sessions.length} sessions, your tags, coins and unlocks. There is no undo.</p>
          <div className="field-row">
            <button className="btn block" onClick={() => setEraseStep(0)}>Cancel</button>
            <button className="btn danger block" onClick={() => void erase()}>Erase everything</button>
          </div>
        </div>
      )}

      {message && <p className="hint">{message}</p>}

      <Sheet open={forest != null} onClose={() => setForest(null)} title="Import from Forest">
        {forest && <ForestPreview result={forest} onImport={() => void runForestImport()} />}
      </Sheet>

      <Sheet open={forestDone != null} onClose={() => setForestDone(null)} title="Import finished 🌳">
        {forestDone && (
          <>
            <p>
              Added <strong>{forestDone.added}</strong> sessions
              {forestDone.updated > 0 && <> and updated {forestDone.updated} already imported</>}.
            </p>
            {forestDone.newTags.length > 0 && <p className="hint">New tags: {forestDone.newTags.join(', ')}</p>}
            <button className="btn primary block" onClick={() => setForestDone(null)}>Nice</button>
          </>
        )}
      </Sheet>

      <Sheet open={backup != null} onClose={() => setBackup(null)} title="Restore backup?">
        {backup && (
          <>
            <p>
              Backup from <strong>{format(backup.exportedAt, 'd MMM yyyy, HH:mm')}</strong> with {backup.sessions.length} sessions
              and {backup.tags.length} tags.
            </p>
            <p className="warning">This replaces everything currently in the app ({sessions.length} sessions).</p>
            <div className="field-row">
              <button className="btn block" onClick={() => setBackup(null)}>Cancel</button>
              <button className="btn primary block" onClick={() => void runRestore()}>Restore</button>
            </div>
          </>
        )}
      </Sheet>
    </section>
  )
}

function ForestPreview({ result, onImport }: { result: ForestParseResult; onImport: () => void }) {
  const { rows, errors } = result
  const ok = rows.filter((r) => r.success)
  const total = ok.reduce((sum, r) => sum + (r.end - r.start), 0)
  const first = rows.length ? Math.min(...rows.map((r) => r.start)) : 0
  const last = rows.length ? Math.max(...rows.map((r) => r.start)) : 0
  const tagNames = [...new Set(rows.map((r) => r.tag).filter(Boolean))]

  return (
    <div className="forest-preview">
      {rows.length > 0 ? (
        <>
          <p>
            Found <strong>{rows.length}</strong> sessions from {format(first, 'd MMM yyyy')} to {format(last, 'd MMM yyyy')}:
            {' '}{ok.length} trees, {rows.length - ok.length} withered, <strong>{formatDuration(total)}</strong> of focus.
          </p>
          {tagNames.length > 0 && <p className="hint">Tags: {tagNames.join(', ')}</p>}
          <p className="hint">First session: {format(rows[0].start, 'd MMM yyyy HH:mm')} – {format(rows[0].end, 'HH:mm')}. If that time looks shifted, cancel — the file’s date format may need a tweak.</p>
        </>
      ) : (
        <p>No sessions could be read from this file.</p>
      )}
      {errors.length > 0 && (
        <div className="warning">
          {errors.length} row{errors.length === 1 ? '' : 's'} skipped:
          <ul>
            {errors.slice(0, 5).map((e) => <li key={e.line}>Line {e.line}: {e.reason}</li>)}
          </ul>
        </div>
      )}
      <p className="hint">Importing the same file again won’t create duplicates.</p>
      <button className="btn primary block" disabled={rows.length === 0} onClick={onImport}>
        Import {rows.length} sessions
      </button>
    </div>
  )
}
