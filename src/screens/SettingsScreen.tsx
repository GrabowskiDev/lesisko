import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { db, updateSettings } from '../db'
import { LANGUAGES, useI18n } from '../i18n'
import {
  BackupError, createBackup, importForestRows, parseBackup, restoreBackup, shareOrDownload,
  type Backup, type ForestImportSummary,
} from '../lib/backup'
import { parseForestCsv, type ForestParseResult, type ForestRowError } from '../lib/forestCsv'
import { createTag, deleteTag, updateTag, useSessions, useTags } from '../store'
import { DeepFocusSheet } from '../components/DeepFocusGuide'
import { TagDot } from '../components/Pickers'
import { Icon, Segmented, Sheet, Toggle } from '../components/ui'
import type { Language, PenaltyMode, Settings, Tag } from '../types'

function Stepper({ value, onChange, min, max, step, format: fmt }: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}) {
  const { t } = useI18n()
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label={t.common.decrease}>−</button>
      <span>{fmt(value)}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label={t.common.increase}>+</button>
    </div>
  )
}

export function SettingsScreen({ settings }: { settings: Settings }) {
  const { t: { settings: t, units }, duration } = useI18n()
  const [guideOpen, setGuideOpen] = useState(false)
  const set = (patch: Partial<Settings>) => void updateSettings(patch)

  return (
    <div className="screen">
      <header className="top-bar">
        <h1>{t.title}</h1>
      </header>

      <section className="card settings-group">
        <h2 className="card-title">{t.language}</h2>
        <Segmented<Language> value={settings.language} onChange={(language) => set({ language })} options={LANGUAGES} />
      </section>

      <section className="card settings-group">
        <h2 className="card-title">{t.leaving}</h2>
        <Segmented<PenaltyMode>
          value={settings.penaltyMode}
          onChange={(penaltyMode) => set({ penaltyMode })}
          options={(['off', 'ask', 'strict'] as const).map((m) => ({ value: m, label: t.penaltyModes[m] }))}
        />
        <p className="hint">{t.penaltyHelp[settings.penaltyMode]}</p>
        {settings.penaltyMode !== 'off' && (
          <div className="setting-row">
            <div>
              <strong>{t.grace}</strong>
              <p className="hint">{t.graceHint}</p>
            </div>
            <Stepper value={settings.graceSeconds} onChange={(graceSeconds) => set({ graceSeconds })} min={0} max={120} step={5} format={units.seconds} />
          </div>
        )}
        {settings.penaltyMode === 'strict' && (
          <div className="setting-row">
            <div>
              <strong>{t.strictLimit}</strong>
              <p className="hint">{t.strictLimitHint}</p>
            </div>
            <Stepper value={settings.strictMinutes} onChange={(strictMinutes) => set({ strictMinutes })} min={1} max={30} step={1} format={units.minutesLong} />
          </div>
        )}
      </section>

      <DeepFocusCard onOpen={() => setGuideOpen(true)} />
      <DeepFocusSheet open={guideOpen} onClose={() => setGuideOpen(false)} />

      <section className="card settings-group">
        <h2 className="card-title">{t.goals}</h2>
        <div className="setting-row">
          <div>
            <strong>{t.dailyGoal}</strong>
          </div>
          <Stepper value={settings.dailyGoalMinutes} onChange={(dailyGoalMinutes) => set({ dailyGoalMinutes })} min={15} max={720} step={15} format={(v) => duration(v * 60_000)} />
        </div>
        <div className="setting-row">
          <div>
            <strong>{t.manualCoins}</strong>
            <p className="hint">{t.manualCoinsHint}</p>
          </div>
          <Toggle checked={settings.manualEarnsCoins} onChange={(manualEarnsCoins) => set({ manualEarnsCoins })} label={t.manualCoins} />
        </div>
        <div className="setting-row">
          <div>
            <strong>{t.sound}</strong>
          </div>
          <Toggle checked={settings.sound} onChange={(sound) => set({ sound })} label={t.sound} />
        </div>
      </section>

      <TagsSection />
      <DataSection settings={settings} />

      <p className="hint center about">{t.footer}</p>
    </div>
  )
}

function DeepFocusCard({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n()
  return (
    <section className="card settings-group">
      <h2 className="card-title">{t.deepFocus.title}</h2>
      <p className="hint">{t.deepFocus.hint}</p>
      <button className="btn block" onClick={onOpen}>{t.deepFocus.button}</button>
    </section>
  )
}

function TagsSection() {
  const { t } = useI18n()
  const tags = useTags()
  const [name, setName] = useState('')

  return (
    <section className="card settings-group">
      <h2 className="card-title">{t.tags.title}</h2>
      {tags.length === 0 && <p className="hint">{t.tags.empty}</p>}
      {tags.map((tag) => <TagRow key={tag.id} tag={tag} />)}
      <form className="tag-add" onSubmit={(e) => { e.preventDefault(); if (name.trim()) void createTag(name).then(() => setName('')) }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.pickers.newTag} maxLength={24} />
        <button className="btn small" type="submit" disabled={!name.trim()}><Icon name="plus" size={16} /> {t.common.add}</button>
      </form>
    </section>
  )
}

function TagRow({ tag }: { tag: Tag }) {
  const { t } = useI18n()
  const [name, setName] = useState(tag.name)
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="tag-row">
      <TagDot tag={tag} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => (name.trim() ? void updateTag(tag.id, { name: name.trim() }) : setName(tag.name))}
        aria-label={t.tags.nameLabel}
        maxLength={24}
      />
      {confirm ? (
        <>
          <button className="btn small" onClick={() => setConfirm(false)}>{t.common.keep}</button>
          <button className="btn small danger" onClick={() => void deleteTag(tag.id)}>{t.common.delete}</button>
        </>
      ) : (
        <button className="icon-btn" onClick={() => setConfirm(true)} aria-label={t.tags.deleteLabel(tag.name)}><Icon name="close" size={18} /></button>
      )}
    </div>
  )
}

function DataSection({ settings }: { settings: Settings }) {
  const { t: { data: t, common, forestImport }, date } = useI18n()
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
    // The file name stays ASCII and language-neutral so backups sort the same everywhere.
    await shareOrDownload(`lesisko-${format(Date.now(), 'yyyy-MM-dd')}.json`, JSON.stringify(data, null, 2), 'application/json')
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
        if (!(e instanceof BackupError)) throw e
        setMessage(e.code === 'invalidJson' ? t.errorInvalidJson : t.errorNotBackup)
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
    setMessage(t.restored(backup.sessions.length))
  }

  const erase = async () => {
    await db.delete()
    location.reload()
  }

  return (
    <section className="card settings-group">
      <h2 className="card-title">{t.title}</h2>
      <p className="hint">{t.explainer}</p>
      <p className="hint">
        {settings.lastBackupAt ? t.lastBackup(date(settings.lastBackupAt, 'd MMM yyyy, HH:mm')) : t.noBackup}
        {persisted != null && ` · ${persisted ? t.persisted : t.notPersisted}`}
      </p>

      <button className="btn primary block" onClick={() => void exportBackup()}>{t.export}</button>
      <button className="btn block" onClick={() => backupInput.current?.click()}>{t.restore}</button>
      <button className="btn block" onClick={() => forestInput.current?.click()}>{t.importForest}</button>
      <input ref={backupInput} type="file" accept=".json,application/json" hidden onChange={onBackupFile} />
      <input ref={forestInput} type="file" accept=".csv,text/csv,text/plain" hidden onChange={onForestFile} />

      {eraseStep === 0 ? (
        <button className="btn ghost danger-text block" onClick={() => setEraseStep(1)}>{t.erase}</button>
      ) : (
        <div className="erase-box">
          <p className="warning">{t.eraseWarning(sessions.length)}</p>
          <div className="field-row">
            <button className="btn block" onClick={() => setEraseStep(0)}>{common.cancel}</button>
            <button className="btn danger block" onClick={() => void erase()}>{t.eraseConfirm}</button>
          </div>
        </div>
      )}

      {message && <p className="hint">{message}</p>}

      <Sheet open={forest != null} onClose={() => setForest(null)} title={forestImport.title}>
        {forest && <ForestPreview result={forest} onImport={() => void runForestImport()} />}
      </Sheet>

      <Sheet open={forestDone != null} onClose={() => setForestDone(null)} title={forestImport.doneTitle}>
        {forestDone && (
          <>
            <p>{forestImport.added(forestDone.added, forestDone.updated)}</p>
            {forestDone.newTags.length > 0 && <p className="hint">{forestImport.newTags(forestDone.newTags.join(', '))}</p>}
            <button className="btn primary block" onClick={() => setForestDone(null)}>{forestImport.nice}</button>
          </>
        )}
      </Sheet>

      <Sheet open={backup != null} onClose={() => setBackup(null)} title={t.restoreTitle}>
        {backup && (
          <>
            <p>{t.restoreSummary(date(backup.exportedAt, 'd MMM yyyy, HH:mm'), backup.sessions.length, backup.tags.length)}</p>
            <p className="warning">{t.restoreWarning(sessions.length)}</p>
            <div className="field-row">
              <button className="btn block" onClick={() => setBackup(null)}>{common.cancel}</button>
              <button className="btn primary block" onClick={() => void runRestore()}>{t.restoreConfirm}</button>
            </div>
          </>
        )}
      </Sheet>
    </section>
  )
}

function ForestPreview({ result, onImport }: { result: ForestParseResult; onImport: () => void }) {
  const { t: { forestImport: t }, date, duration } = useI18n()
  const { rows, errors } = result
  const ok = rows.filter((r) => r.success)
  const total = ok.reduce((sum, r) => sum + (r.end - r.start), 0)
  const first = rows.length ? Math.min(...rows.map((r) => r.start)) : 0
  const last = rows.length ? Math.max(...rows.map((r) => r.start)) : 0
  const tagNames = [...new Set(rows.map((r) => r.tag).filter(Boolean))]

  const reason = (e: ForestRowError): string => {
    switch (e.kind) {
      case 'empty': return t.errors.empty
      case 'columns': return t.errors.columns(e.header)
      case 'date': return t.errors.date(e.value)
      case 'order': return t.errors.order
    }
  }

  return (
    <div className="forest-preview">
      {rows.length > 0 ? (
        <>
          <p>
            {t.found(rows.length, date(first, 'd MMM yyyy'), date(last, 'd MMM yyyy'), ok.length, rows.length - ok.length, duration(total))}
          </p>
          {tagNames.length > 0 && <p className="hint">{t.tags(tagNames.join(', '))}</p>}
          <p className="hint">{t.firstSession(`${date(rows[0].start, 'd MMM yyyy HH:mm')} – ${date(rows[0].end, 'HH:mm')}`)}</p>
        </>
      ) : (
        <p>{t.nothingFound}</p>
      )}
      {errors.length > 0 && (
        <div className="warning">
          {t.skipped(errors.length)}
          <ul>
            {errors.slice(0, 5).map((e) => <li key={e.line}>{t.line(e.line, reason(e.error))}</li>)}
          </ul>
        </div>
      )}
      <p className="hint">{t.noDuplicates}</p>
      <button className="btn primary block" disabled={rows.length === 0} onClick={onImport}>
        {t.confirm(rows.length)}
      </button>
    </div>
  )
}
