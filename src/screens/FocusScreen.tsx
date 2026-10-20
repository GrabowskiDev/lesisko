import { useState } from 'react'
import { getSpecies } from '../data/species'
import { updateSettings } from '../db'
import { useI18n } from '../i18n'
import { currentStreak, totalFocus } from '../lib/stats'
import { MINUTE, periodRange } from '../lib/time'
import { unlockAudio } from '../lib/sound'
import { useCoins, useSessions, useTags } from '../store'
import { SessionSheet } from '../components/SessionForm'
import { SpeciesSheet, TagChip, TagSheet } from '../components/Pickers'
import { Tree } from '../components/Tree'
import { CoinBadge, Icon, Segmented } from '../components/ui'
import type { ActiveSession, Settings, TimerMode } from '../types'

const BACKUP_NUDGE_DAYS = 14

export function FocusScreen({ settings, onStart, onOpenSettings }: {
  settings: Settings
  onStart: (active: ActiveSession) => void
  onOpenSettings: () => void
}) {
  const { t: { focus: t, species: speciesNames }, duration } = useI18n()
  const sessions = useSessions()
  const tags = useTags()
  const coins = useCoins()
  const [minutes, setMinutes] = useState(settings.defaultMinutes)
  const [tagSheet, setTagSheet] = useState(false)
  const [speciesSheet, setSpeciesSheet] = useState(false)
  const [logSheet, setLogSheet] = useState(false)

  const now = new Date()
  const today = totalFocus(sessions, periodRange('day', now))
  const goal = settings.dailyGoalMinutes * MINUTE
  const streak = currentStreak(sessions, now)
  const species = getSpecies(settings.speciesId)
  const tag = tags.find((tg) => tg.id === settings.tagId)
  const mode = settings.timerMode

  const needsBackup =
    sessions.length > 0 &&
    (settings.lastBackupAt == null || Date.now() - settings.lastBackupAt > BACKUP_NUDGE_DAYS * 24 * 60 * MINUTE)

  const plant = () => {
    unlockAudio()
    void updateSettings({ defaultMinutes: minutes })
    onStart({
      start: Date.now(),
      mode,
      plannedMinutes: minutes,
      speciesId: settings.speciesId,
      tagId: settings.tagId,
    })
  }

  return (
    <div className="screen focus-screen">
      <header className="top-bar">
        <span className="greeting">{t.greeting(now.getHours())}</span>
        <CoinBadge coins={coins} />
      </header>

      <section className="today card">
        <div className="today-row">
          <div>
            <span className="label">{t.today}</span>
            <strong className="today-total">{duration(today)}</strong>
            <span className="hint"> {t.ofGoal(duration(goal))}</span>
          </div>
          {streak > 0 && <span className="streak">{t.streak(streak)}</span>}
        </div>
        <div className="progress" role="progressbar" aria-valuenow={Math.round((today / goal) * 100)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.min(100, (today / goal) * 100)}%` }} />
        </div>
        {today >= goal && <p className="hint goal-done">{t.goalReached}</p>}
      </section>

      {needsBackup && (
        <button className="nudge" onClick={onOpenSettings}>
          💾 {settings.lastBackupAt ? t.backupStale : t.backupNever} ›
        </button>
      )}

      <button className="tree-stage idle" onClick={() => setSpeciesSheet(true)} aria-label={t.chooseTree}>
        <Tree species={species} size={150} />
        <span className="tree-stage-name">{speciesNames[species.id].name}</span>
      </button>

      <div className="focus-controls">
        <Segmented<TimerMode>
          value={mode}
          onChange={(m) => void updateSettings({ timerMode: m })}
          options={[{ value: 'countdown', label: t.timer }, { value: 'stopwatch', label: t.stopwatch }]}
          small
        />
        <TagChip tag={tag} onClick={() => setTagSheet(true)} />
      </div>

      {mode === 'countdown' ? (
        <div className="duration-picker">
          <div className="clock">{minutes}:00</div>
          <input
            type="range"
            min={5}
            max={180}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            aria-label={t.lengthLabel}
          />
        </div>
      ) : (
        <div className="duration-picker">
          <div className="clock">0:00</div>
          <p className="hint center">{t.stopwatchHint}</p>
        </div>
      )}

      <button className="btn primary big" onClick={plant}>{t.plant}</button>
      <button className="btn ghost" onClick={() => setLogSheet(true)}>
        <Icon name="plus" size={18} /> {t.logForgotten}
      </button>

      <TagSheet open={tagSheet} onClose={() => setTagSheet(false)} value={settings.tagId} onChange={(id) => void updateSettings({ tagId: id })} />
      <SpeciesSheet open={speciesSheet} onClose={() => setSpeciesSheet(false)} value={settings.speciesId} onChange={(id) => void updateSettings({ speciesId: id })} />
      <SessionSheet open={logSheet} onClose={() => setLogSheet(false)} />
    </div>
  )
}
