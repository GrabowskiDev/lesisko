import { useState } from 'react'
import { startOfDay } from 'date-fns'
import { getSpecies } from '../data/species'
import { useI18n } from '../i18n'
import { focusMs, sessionsInRange, totalFocus } from '../lib/stats'
import { formatTime, HOUR, periodRange, shiftAnchor, type Period } from '../lib/time'
import { useSessions, useTags } from '../store'
import { SessionSheet } from '../components/SessionForm'
import { TagDot } from '../components/Pickers'
import { Tree } from '../components/Tree'
import { Icon, PeriodNav, PeriodTabs } from '../components/ui'
import type { Session } from '../types'

/** Rendering hundreds of SVG trees gets slow on phones; past this we summarise. */
const MAX_TREES = 200

/** Longer sessions grow bigger trees in the forest view. */
function treeScale(s: Session): number {
  const hours = (s.end - s.start) / HOUR
  return Math.min(1.25, 0.8 + hours * 0.2)
}

export function ForestScreen() {
  const { t: { forest: t }, duration, date, cap } = useI18n()
  const sessions = useSessions()
  const tags = useTags()
  const [period, setPeriod] = useState<Period>('day')
  const [anchor, setAnchor] = useState(() => new Date())
  const [editing, setEditing] = useState<Session | null>(null)
  const [adding, setAdding] = useState(false)

  const range = periodRange(period, anchor)
  const visible = sessionsInRange(sessions, range).filter((s) => s.start >= range.start)
  const alive = visible.filter((s) => s.status === 'completed')
  const total = totalFocus(sessions, range)
  const shown = visible.slice(0, MAX_TREES)

  const byDay = new Map<number, Session[]>()
  for (const s of [...visible].reverse()) {
    const day = +startOfDay(s.start)
    byDay.set(day, [...(byDay.get(day) ?? []), s])
  }

  return (
    <div className="screen">
      <header className="top-bar">
        <h1>{t.title}</h1>
      </header>

      <PeriodTabs value={period} onChange={setPeriod} />
      <PeriodNav period={period} anchor={anchor} onShift={(d) => setAnchor(shiftAnchor(period, anchor, d))} onReset={() => setAnchor(new Date())} />

      <section className="ground" aria-label={t.groundLabel}>
        {visible.length === 0 ? (
          <div className="ground-empty">
            <Tree species={getSpecies('oak')} growth={0.05} size={70} />
            <p>{t.empty}</p>
          </div>
        ) : (
          <div className="ground-grid">
            {shown.map((s) => (
              <button key={s.id} className="ground-tree" onClick={() => setEditing(s)} aria-label={t.sessionLabel(duration(s.end - s.start))}>
                <Tree species={getSpecies(s.speciesId)} withered={s.status === 'withered'} size={`${treeScale(s) * 100}%`} />
                {s.source === 'manual' && <span className="manual-mark" title={t.manualMark}><Icon name="pencil" size={9} /></span>}
              </button>
            ))}
          </div>
        )}
        {visible.length > MAX_TREES && <p className="hint center">{t.more(visible.length - MAX_TREES)}</p>}
      </section>

      <p className="forest-summary">
        <strong>{t.trees(alive.length)}</strong> · <strong>{duration(total)}</strong> {t.focused}
        {visible.length > alive.length && <> · {t.withered(visible.length - alive.length)}</>}
      </p>

      <section className="session-list">
        {[...byDay].map(([day, list]) => (
          <div key={day} className="day-group">
            <h3>
              {cap(date(day, 'EEEE, d MMM'))}
              <span>{duration(list.reduce((sum, s) => sum + focusMs(s), 0))}</span>
            </h3>
            {list.map((s) => {
              const tag = tags.find((tg) => tg.id === s.tagId)
              return (
                <button key={s.id} className="session-row" onClick={() => setEditing(s)}>
                  <Tree species={getSpecies(s.speciesId)} withered={s.status === 'withered'} size={34} />
                  <div className="session-info">
                    <strong>{duration(s.end - s.start)}</strong>
                    <span className="hint">
                      {formatTime(s.start)} – {formatTime(s.end)}
                      {s.note && ` · ${s.note}`}
                    </span>
                  </div>
                  <div className="session-meta">
                    {tag && <span className="mini-tag"><TagDot tag={tag} /> {tag.name}</span>}
                    {t.source[s.source] && <span className="source-badge">{t.source[s.source]}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </section>

      <button className="fab" onClick={() => setAdding(true)} aria-label={t.logTime}>
        <Icon name="plus" size={26} />
      </button>

      <SessionSheet open={adding} onClose={() => setAdding(false)} />
      <SessionSheet open={editing != null} onClose={() => setEditing(null)} session={editing ?? undefined} />
    </div>
  )
}
