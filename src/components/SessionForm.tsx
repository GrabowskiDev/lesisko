import { useMemo, useState } from 'react'
import { deleteSession, saveSession, useSessions, useSettings } from '../store'
import { formatDuration, formatTime, fromDateTimeInputs, MINUTE, toDateInput, toTimeInput } from '../lib/time'
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
  return (
    <Sheet open={open} onClose={onClose} title={session ? 'Edit session' : 'Log focus time'}>
      {/* Remount per session so the form state starts fresh. */}
      {open && <SessionForm key={session?.id ?? 'new'} session={session} onDone={onClose} />}
    </Sheet>
  )
}

function SessionForm({ session, onDone }: { session?: Session; onDone: () => void }) {
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

  const totalMinutes = hours * 60 + mins
  const start = date && time ? fromDateTimeInputs(date, time) : NaN
  const end = start + totalMinutes * MINUTE

  const error =
    Number.isNaN(start) ? 'Pick a date and start time.'
    : totalMinutes <= 0 ? 'Duration must be more than 0 minutes.'
    : totalMinutes > 16 * 60 ? 'That’s more than 16 hours — split it into a few sessions.'
    : end > Date.now() + MINUTE ? 'This session would end in the future.'
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
        <p className="hint">Studied without the timer? Add it here and it counts in your stats and forest just like a timed session.</p>
      )}

      <div className="field-row">
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} max={toDateInput(Date.now())} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Started at</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      <div className="field">
        <span>Duration</span>
        <div className="chip-row">
          {QUICK.map((m) => (
            <button type="button" key={m} className={`chip${m === totalMinutes ? ' selected' : ''}`} onClick={() => setQuick(m)}>
              {formatDuration(m * MINUTE)}
            </button>
          ))}
        </div>
        <div className="field-row duration">
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))} aria-label="Hours">
            {Array.from({ length: 17 }, (_, h) => <option key={h} value={h}>{h} h</option>)}
          </select>
          <select value={mins} onChange={(e) => setMins(Number(e.target.value))} aria-label="Minutes">
            {Array.from({ length: 60 }, (_, m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
        {!error && <span className="hint">{formatTime(start)} – {formatTime(end)}</span>}
      </div>

      <div className="field">
        <span>Tag</span>
        <TagPicker value={tagId} onChange={setTagId} />
      </div>

      <div className="field">
        <span>Tree</span>
        <SpeciesPicker value={speciesId} onChange={setSpeciesId} />
      </div>

      <label className="field">
        <span>Note</span>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional — e.g. Chapter 4 exercises" maxLength={200} />
      </label>

      {session && (
        <div className="setting-row">
          <div>
            <strong>Tree survived</strong>
            <p className="hint">Withered trees don’t count towards focus time or coins.</p>
          </div>
          <Toggle checked={survived} onChange={setSurvived} label="Tree survived" />
        </div>
      )}

      {overlapping.length > 0 && (
        <p className="warning">
          Heads up: this overlaps {overlapping.length === 1 ? 'another session' : `${overlapping.length} other sessions`} ({overlapping.map((s) => `${formatTime(s.start)}–${formatTime(s.end)}`).join(', ')}). Both will count.
        </p>
      )}
      {error && <p className="warning">{error}</p>}

      <button type="submit" className="btn primary block" disabled={!!error}>
        {session ? 'Save changes' : `Add ${totalMinutes > 0 ? formatDuration(totalMinutes * MINUTE) : 'session'}`}
      </button>

      {session && (
        confirmDelete ? (
          <div className="field-row">
            <button type="button" className="btn block" onClick={() => setConfirmDelete(false)}>Keep it</button>
            <button type="button" className="btn danger block" onClick={() => void remove()}>Delete for good</button>
          </div>
        ) : (
          <button type="button" className="btn ghost danger-text block" onClick={() => setConfirmDelete(true)}>Delete session</button>
        )
      )}
    </form>
  )
}
