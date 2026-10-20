import { useState } from 'react'
import { format, startOfDay } from 'date-fns'
import { getSpecies } from '../data/species'
import { focusMs, sessionsInRange, totalFocus } from '../lib/stats'
import { formatDuration, formatTime, HOUR, periodRange, shiftAnchor, type Period } from '../lib/time'
import { useSessions, useTags } from '../store'
import { SessionSheet } from '../components/SessionForm'
import { TagDot } from '../components/Pickers'
import { Tree } from '../components/Tree'
import { Icon, PERIOD_OPTIONS, PeriodNav, Segmented } from '../components/ui'
import type { Session } from '../types'

/** Rendering hundreds of SVG trees gets slow on phones; past this we summarise. */
const MAX_TREES = 200

const SOURCE_LABEL: Record<Session['source'], string | null> = {
  timer: null,
  manual: 'logged',
  import: 'imported',
}

/** Longer sessions grow bigger trees in the forest view. */
function treeScale(s: Session): number {
  const hours = (s.end - s.start) / HOUR
  return Math.min(1.25, 0.8 + hours * 0.2)
}

export function ForestScreen() {
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
        <h1>My Forest</h1>
      </header>

      <Segmented value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />
      <PeriodNav period={period} anchor={anchor} onShift={(d) => setAnchor(shiftAnchor(period, anchor, d))} onReset={() => setAnchor(new Date())} />

      <section className="ground" aria-label="Trees planted in this period">
        {visible.length === 0 ? (
          <div className="ground-empty">
            <Tree species={getSpecies('oak')} growth={0.05} size={70} />
            <p>No trees here yet. Plant one, or log time you forgot to track.</p>
          </div>
        ) : (
          <div className="ground-grid">
            {shown.map((s) => (
              <button key={s.id} className="ground-tree" onClick={() => setEditing(s)} aria-label={`${formatDuration(s.end - s.start)} session`}>
                <Tree species={getSpecies(s.speciesId)} withered={s.status === 'withered'} size={`${treeScale(s) * 100}%`} />
                {s.source === 'manual' && <span className="manual-mark" title="Logged manually"><Icon name="pencil" size={9} /></span>}
              </button>
            ))}
          </div>
        )}
        {visible.length > MAX_TREES && <p className="hint center">+ {visible.length - MAX_TREES} more trees</p>}
      </section>

      <p className="forest-summary">
        <strong>{alive.length}</strong> tree{alive.length === 1 ? '' : 's'} · <strong>{formatDuration(total)}</strong> focused
        {visible.length > alive.length && <> · {visible.length - alive.length} withered</>}
      </p>

      <section className="session-list">
        {[...byDay].map(([day, list]) => (
          <div key={day} className="day-group">
            <h3>
              {format(day, 'EEEE, d MMM')}
              <span>{formatDuration(list.reduce((sum, s) => sum + focusMs(s), 0))}</span>
            </h3>
            {list.map((s) => {
              const tag = tags.find((t) => t.id === s.tagId)
              return (
                <button key={s.id} className="session-row" onClick={() => setEditing(s)}>
                  <Tree species={getSpecies(s.speciesId)} withered={s.status === 'withered'} size={34} />
                  <div className="session-info">
                    <strong>{formatDuration(s.end - s.start)}</strong>
                    <span className="hint">
                      {formatTime(s.start)} – {formatTime(s.end)}
                      {s.note && ` · ${s.note}`}
                    </span>
                  </div>
                  <div className="session-meta">
                    {tag && <span className="mini-tag"><TagDot tag={tag} /> {tag.name}</span>}
                    {SOURCE_LABEL[s.source] && <span className="source-badge">{SOURCE_LABEL[s.source]}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </section>

      <button className="fab" onClick={() => setAdding(true)} aria-label="Log focus time">
        <Icon name="plus" size={26} />
      </button>

      <SessionSheet open={adding} onClose={() => setAdding(false)} />
      <SessionSheet open={editing != null} onClose={() => setEditing(null)} session={editing ?? undefined} />
    </div>
  )
}
