import { useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { deleteSession, saveSession, useSessions, useSettings } from '../store'
import { formatTime, fromDateTimeInputs, MINUTE, toDateInput, toTimeInput } from '../lib/time'
import { SpeciesPicker, TagPicker } from './Pickers'
import { Sheet, Toggle } from './ui'
import type { Session } from '../types'

const QUICK = [15, 30, 45, 60, 90, 120, 180]

/** Add a session you forgot to time, or edit/delete an existing one. */
export function SessionSheet({ open, onClose, session }: {
  open: boolean
  onClose: () => void
  /** Existing session to edit; omit to add a manual one. */
  session?: Session
}) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onClose={onClose} title={session ? t.sessionForm.editTitle : t.sessionForm.addTitle}>
      {/* Remount per session so the form state starts fresh. */}
      {open && <SessionForm key={session?.id ?? 'new'} session={session} onDone={onClose} />}
    </Sheet>
  )
}

function SessionForm({ session, onDone }: { session?: Session; onDone: () => void }) {
  const { t: { sessionForm: t, common }, duration } = useI18n()
  const settings = useSettings()
  const sessions = useSessions()
  const initial = useMemo(() => {
    if (session) return { start: session.start, minutes: Math.round((session.end - session.start) / MINUTE) }
    // Default: an hour that just ended, rounded down to 5 minutes.
    const end = Math.floor(Date.now() / (5 * MINUTE)) * 5 * MINUTE
    return { start: end - 60 * MINUTE, minutes: 60 }
  }, [session])

  const [date, setDate] = useState(toDateInput(initial.start))
  const [time, setTime] = useState(toTimeInput(initial.start))
  const [hours, setHours] = useState(Math.floor(initial.minutes / 60))
  const [mins, setMins] = useState(initial.minutes % 60)
  const [tagId, setTagId] = useState<string | null>(session ? session.tagId : settings.tagId)
  const [speciesId, setSpeciesId] = useState(session?.speciesId ?? settings.speciesId)
  const [note, setNote] = useState(session?.note ?? '')
  const [survived, setSurvived] = useState(session ? session.status === 'completed' : true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  const totalMinutes = hours * 60 + mins
  const start = date && time ? fromDateTimeInputs(date, time) : NaN
  const end = start + totalMinutes * MINUTE

  const error =
    Number.isNaN(start) ? t.errorNoDate
    : totalMinutes <= 0 ? t.errorZero
    : totalMinutes > 16 * 60 ? t.errorTooLong
    : end > Date.now() + MINUTE ? t.errorFuture
    : null

  const overlapping = error
    ? []
    : sessions.filter((s) => s.id !== session?.id && s.start < end && s.end > start && s.status === 'completed')

  const setQuick = (m: number) => {
    setHours(Math.floor(m / 60))
    setMins(m % 60)
  }

  const save = async () => {
    if (error) return
    try {
      await saveSession({
        id: session?.id,
        start,
        end,
        status: survived ? 'completed' : 'withered',
        source: session?.source ?? 'manual',
        speciesId,
        tagId,
        note: note.trim() || undefined,
      })
    } catch (e) {
      console.error(e)
      setSaveFailed(true)
      return
    }
    onDone()
  }

  const remove = async () => {
    if (!session) return
    await deleteSession(session.id)
    onDone()
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); void save() }}>
      {!session && (
        <p className="hint">{t.intro}</p>
      )}

      <div className="field-row">
        <label className="field">
          <span>{t.date}</span>
          <input type="date" value={date} max={toDateInput(Date.now())} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>{t.startedAt}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      <div className="field">
        <span>{t.duration}</span>
        <div className="chip-row">
          {QUICK.map((m) => (
            <button type="button" key={m} className={`chip${m === totalMinutes ? ' selected' : ''}`} onClick={() => setQuick(m)}>
              {duration(m * MINUTE)}
            </button>
          ))}
        </div>
        <div className="field-row duration">
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))} aria-label={t.hoursLabel}>
            {Array.from({ length: 17 }, (_, h) => <option key={h} value={h}>{t.hoursOption(h)}</option>)}
          </select>
          <select value={mins} onChange={(e) => setMins(Number(e.target.value))} aria-label={t.minutesLabel}>
            {Array.from({ length: 60 }, (_, m) => <option key={m} value={m}>{t.minutesOption(m)}</option>)}
          </select>
        </div>
        {!error && <span className="hint">{formatTime(start)} – {formatTime(end)}</span>}
      </div>

      <div className="field">
        <span>{t.tag}</span>
        <TagPicker value={tagId} onChange={setTagId} />
      </div>

      <div className="field">
        <span>{t.tree}</span>
        <SpeciesPicker value={speciesId} onChange={setSpeciesId} />
      </div>

      <label className="field">
        <span>{t.note}</span>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.notePlaceholder} maxLength={200} />
      </label>

      {session && (
        <div className="setting-row">
          <div>
            <strong>{t.survived}</strong>
            <p className="hint">{t.survivedHint}</p>
          </div>
          <Toggle checked={survived} onChange={setSurvived} label={t.survived} />
        </div>
      )}

      {overlapping.length > 0 && (
        <p className="warning">
          {t.overlap(overlapping.length, overlapping.map((s) => `${formatTime(s.start)}–${formatTime(s.end)}`).join(', '))}
        </p>
      )}
      {error && <p className="warning">{error}</p>}
      {saveFailed && <p className="warning" role="alert">{common.saveFailed}</p>}

      <button type="submit" className="btn primary block" disabled={!!error}>
        {session ? t.save : totalMinutes > 0 ? t.addDuration(duration(totalMinutes * MINUTE)) : t.addSession}
      </button>

      {session && (
        confirmDelete ? (
          <div className="field-row">
            <button type="button" className="btn block" onClick={() => setConfirmDelete(false)}>{t.keepIt}</button>
            <button type="button" className="btn danger block" onClick={() => void remove()}>{t.deleteForGood}</button>
          </div>
        ) : (
          <button type="button" className="btn ghost danger-text block" onClick={() => setConfirmDelete(true)}>{t.deleteSession}</button>
        )
      )}
    </form>
  )
}
