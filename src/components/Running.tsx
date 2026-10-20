import { useCallback, useEffect, useRef, useState } from 'react'
import { getSpecies } from '../data/species'
import { useI18n } from '../i18n'
import { saveActive } from '../lib/activeSession'
import { awayMs, judgeAbsence, plannedEnd } from '../lib/penalty'
import { chime } from '../lib/sound'
import { formatClock, MINUTE } from '../lib/time'
import { saveSession, useTags } from '../store'
import { TagChip } from './Pickers'
import { Tree } from './Tree'
import { CoinIcon, Sheet } from './ui'
import type { ActiveSession, Session, Settings } from '../types'

/** Stopwatch sessions shorter than this aren't saved. */
const MIN_STOPWATCH = MINUTE
/** In stopwatch mode the tree is fully grown after this long. */
const STOPWATCH_FULL = 60 * MINUTE

/** Picks a message that stays put for a while (`seed` is a timestamp). */
function pick(list: string[], seed: number): string {
  return list[Math.abs(Math.floor(seed / 1000)) % list.length]
}

interface Props {
  active: ActiveSession
  settings: Settings
  /** Called once the user dismisses the result screen. */
  onClose: () => void
}

export function Running({ active: initial, settings, onClose }: Props) {
  const { t: { running: t, units, common }, duration } = useI18n()
  const [active, setActiveState] = useState(initial)
  const [now, setNow] = useState(Date.now())
  const [checkInAway, setCheckInAway] = useState<number | null>(null)
  const [confirmGiveUp, setConfirmGiveUp] = useState(false)
  const [result, setResult] = useState<Session | null>(null)
  const [tooShort, setTooShort] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const finishing = useRef(false)
  const tags = useTags()

  const species = getSpecies(active.speciesId)
  const end = plannedEnd(active)
  const elapsed = now - active.start
  const growth = end == null ? elapsed / STOPWATCH_FULL : elapsed / (end - active.start)

  // Visibility handlers need the latest session without re-subscribing on every change.
  const activeRef = useRef(active)
  activeRef.current = active

  const update = useCallback((next: ActiveSession) => {
    activeRef.current = next
    saveActive(next)
    setActiveState(next)
  }, [])

  const finish = useCallback(async (status: Session['status'], at: number) => {
    if (finishing.current) return
    finishing.current = true
    const { start, speciesId, tagId } = activeRef.current
    let session: Session
    try {
      session = await saveSession({ start, end: at, status, source: 'timer', speciesId, tagId })
    } catch (e) {
      // Keep the running session (it's still in localStorage) so nothing is lost, and say so.
      console.error(e)
      finishing.current = false
      setSaveFailed(true)
      return
    }
    saveActive(null)
    if (status === 'completed' && settings.sound && document.visibilityState === 'visible') chime()
    setResult(session)
  }, [settings.sound])

  /** Called when we become visible again (or start up with a pending absence). */
  const resolveAbsence = useCallback(() => {
    const current = activeRef.current
    if (current.hiddenAt == null || finishing.current) return
    const at = Date.now()
    setNow(at)
    switch (judgeAbsence(current, at, settings)) {
      case 'continue':
        update({ ...current, hiddenAt: undefined })
        break
      case 'ask':
        setCheckInAway(awayMs(current, at))
        break
      case 'wither':
        void finish('withered', Math.min(at, current.hiddenAt + settings.strictMinutes * MINUTE))
        break
    }
  }, [settings, update, finish])

  // Track the app being hidden (phone locked or another app opened). If we're hidden
  // again before answering a check-in, the original hiddenAt is kept.
  useEffect(() => {
    const onHide = () => {
      if (finishing.current || activeRef.current.hiddenAt != null) return
      update({ ...activeRef.current, hiddenAt: Date.now() })
    }
    const onVisibility = () => (document.visibilityState === 'hidden' ? onHide() : resolveAbsence())
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
    }
  }, [update, resolveAbsence])

  // The app may have been killed in the background; resolve that absence on launch.
  const resolvedOnMount = useRef(false)
  useEffect(() => {
    if (resolvedOnMount.current) return
    resolvedOnMount.current = true
    resolveAbsence()
  }, [resolveAbsence])

  // Tick, and complete countdowns once they reach the end.
  useEffect(() => {
    if (result) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [result])

  useEffect(() => {
    if (end != null && now >= end && active.hiddenAt == null && checkInAway == null && !result) {
      void finish('completed', end)
    }
  }, [now, end, active.hiddenAt, checkInAway, result, finish])

  const answerCheckIn = (stillFocused: boolean) => {
    const hiddenAt = active.hiddenAt ?? Date.now()
    setCheckInAway(null)
    if (stillFocused) update({ ...active, hiddenAt: undefined })
    else void finish('withered', hiddenAt)
  }

  const stopStopwatch = () => {
    if (elapsed < MIN_STOPWATCH) {
      setTooShort(true)
      return
    }
    void finish('completed', Date.now())
  }

  const awayLabel = (ms: number) => (ms < MINUTE ? units.seconds(Math.round(ms / 1000)) : duration(ms))

  const discard = () => {
    saveActive(null)
    onClose()
  }

  if (result) return <Result session={result} onClose={onClose} />

  const tag = tags.find((tg) => tg.id === active.tagId)
  return (
    <div className="running">
      <p className="running-message">{pick(t.growing, active.start + Math.floor(elapsed / (5 * MINUTE)) * 5 * MINUTE)}</p>
      <div className="tree-stage growing">
        <Tree species={species} growth={growth} size={220} />
      </div>
      <div className="clock" aria-live="off">
        {end == null ? formatClock(elapsed) : formatClock(end - now)}
      </div>
      <TagChip tag={tag} />

      <div className="running-actions">
        {end == null ? (
          <button className="btn primary" onClick={stopStopwatch}>{t.done}</button>
        ) : null}
        <button className="btn ghost danger-text" onClick={() => setConfirmGiveUp(true)}>{t.giveUp}</button>
      </div>

      {saveFailed && <p className="warning" role="alert">{common.saveFailed}</p>}

      {settings.penaltyMode !== 'off' && (
        <p className="hint center running-rule">
          {settings.penaltyMode === 'ask' ? t.ruleAsk : t.ruleStrict(settings.strictMinutes)}
        </p>
      )}

      <Sheet open={confirmGiveUp} onClose={() => setConfirmGiveUp(false)} title={t.giveUpTitle}>
        <p className="hint">{t.giveUpBody}</p>
        <div className="field-row">
          <button className="btn block" onClick={() => setConfirmGiveUp(false)}>{t.keepGrowing}</button>
          <button className="btn danger block" onClick={() => { setConfirmGiveUp(false); void finish('withered', Date.now()) }}>{t.giveUp}</button>
        </div>
      </Sheet>

      <Sheet open={tooShort} onClose={() => setTooShort(false)} title={t.tooShortTitle}>
        <p className="hint">{t.tooShortBody}</p>
        <div className="field-row">
          <button className="btn block" onClick={discard}>{t.discard}</button>
          <button className="btn primary block" onClick={() => setTooShort(false)}>{t.keepGoing}</button>
        </div>
      </Sheet>

      <Sheet open={checkInAway != null} onClose={() => {}} title={t.checkInTitle}>
        <p className="checkin-text">
          {t.checkInAway} <strong>{awayLabel(checkInAway ?? 0)}</strong>. {t.checkInQuestion}
        </p>
        <div className="checkin-actions">
          <button className="btn primary block" onClick={() => answerCheckIn(true)}>{t.checkInYes}</button>
          <button className="btn block" onClick={() => answerCheckIn(false)}>{t.checkInNo}</button>
        </div>
        <p className="hint center">{t.checkInHonest}</p>
      </Sheet>
    </div>
  )
}

function Result({ session, onClose }: { session: Session; onClose: () => void }) {
  const { t: { result: t }, duration } = useI18n()
  const ok = session.status === 'completed'
  const species = getSpecies(session.speciesId)
  return (
    <div className="running result">
      <h1>{ok ? t.planted : t.withered}</h1>
      <div className="tree-stage">
        <Tree species={species} withered={!ok} size={220} />
      </div>
      <p className="running-message">{pick(ok ? t.plantedMessages : t.witheredMessages, session.end)}</p>
      {ok && (
        <div className="result-stats">
          <span>{t.focused(duration(session.end - session.start))}</span>
          <span className="coin-earned"><CoinIcon size={18} /> +{session.coins}</span>
        </div>
      )}
      <button className="btn primary" onClick={onClose}>{ok ? t.back : t.tryAgain}</button>
    </div>
  )
}
