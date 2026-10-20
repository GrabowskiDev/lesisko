import { useState } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { useI18n } from '../i18n'
import { buckets, currentStreak, sessionsInRange, totalFocus, totalsByTag } from '../lib/stats'
import { periodRange, shiftAnchor, type Period, type Range } from '../lib/time'
import { tagColor, useDark, useSessions, useTags } from '../store'
import { BarChart } from '../components/BarChart'
import { TagDot } from '../components/Pickers'
import { PeriodNav, PeriodTabs } from '../components/ui'

/**
 * The previous period, cut to the same length as the part of the current one that has
 * happened, so a half-finished week is compared with the first half of last week.
 */
function previousRange(period: Period, anchor: Date, current: Range): { range: Range; partial: boolean } {
  const prev = periodRange(period, shiftAnchor(period, anchor, -1))
  const now = Date.now()
  if (now <= current.start || now >= current.end) return { range: prev, partial: false }
  return { range: { start: prev.start, end: Math.min(prev.end, prev.start + (now - current.start)) }, partial: true }
}

export function StatsScreen() {
  const { t: { stats: t, common }, duration } = useI18n()
  const sessions = useSessions()
  const tags = useTags()
  const dark = useDark()
  const [period, setPeriod] = useState<Period>('week')
  const [anchor, setAnchor] = useState(() => new Date())

  const range = periodRange(period, anchor)
  const inRange = sessionsInRange(sessions, range).filter((s) => s.start >= range.start)
  const total = totalFocus(sessions, range)
  const prev = previousRange(period, anchor, range)
  const previous = totalFocus(sessions, prev.range)
  const planted = inRange.filter((s) => s.status === 'completed').length
  const withered = inRange.length - planted
  const byTag = totalsByTag(sessions, range)
  const streak = currentStreak(sessions)

  // Average over the days of the period that have started so far.
  const daysSoFar = Math.max(1, differenceInCalendarDays(Math.min(Date.now(), range.end - 1), range.start) + 1)
  const delta = previous > 0 ? Math.round(((total - previous) / previous) * 100) : null

  return (
    <div className="screen">
      <header className="top-bar">
        <h1>{t.title}</h1>
      </header>

      <PeriodTabs value={period} onChange={setPeriod} />
      <PeriodNav period={period} anchor={anchor} onShift={(d) => setAnchor(shiftAnchor(period, anchor, d))} onReset={() => setAnchor(new Date())} />

      <section className="hero card">
        <span className="label">{t.focused}</span>
        <strong className="hero-number">{duration(total)}</strong>
        {delta != null && (
          <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
            {delta >= 0 ? '▲' : '▼'} {t.delta(Math.abs(delta), period, prev.partial)}
          </span>
        )}
      </section>

      <section className="tiles">
        <div className="tile card">
          <span className="label">{t.planted}</span>
          <strong>{planted}</strong>
        </div>
        <div className="tile card">
          <span className="label">{t.withered}</span>
          <strong>{withered}</strong>
        </div>
        {period !== 'day' && (
          <div className="tile card">
            <span className="label">{t.dailyAverage}</span>
            <strong>{duration(total / daysSoFar)}</strong>
          </div>
        )}
        <div className="tile card">
          <span className="label">{t.streak}</span>
          <strong>{t.days(streak)}</strong>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">{t.chartTitle}</h2>
        <BarChart key={`${period}-${range.start}`} buckets={buckets(period, anchor, sessions)} period={period} />
      </section>

      <section className="card">
        <h2 className="card-title">{t.byTag}</h2>
        {byTag.length === 0 ? (
          <p className="hint">{t.nothing}</p>
        ) : (
          <ul className="tag-bars">
            {byTag.map(({ tagId, ms }) => {
              const tag = tags.find((tg) => tg.id === tagId)
              const pct = total > 0 ? (ms / total) * 100 : 0
              return (
                <li key={tagId ?? 'none'}>
                  <div className="tag-bar-label">
                    <span><TagDot tag={tag} /> {tag?.name ?? common.noTag}</span>
                    <span>{duration(ms)} <span className="hint">· {Math.round(pct)}%</span></span>
                  </div>
                  <div className="tag-bar-track">
                    <span style={{ width: `${pct}%`, background: tagColor(tag, dark) }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
