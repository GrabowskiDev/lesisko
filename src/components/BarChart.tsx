import { useState } from 'react'
import { formatDuration, HOUR, MINUTE, type Period } from '../lib/time'
import type { Bucket } from '../lib/stats'

const W = 340
const H = 170
const PAD = { top: 8, right: 4, bottom: 22, left: 30 }

/** Picks a round axis maximum (in ms) at or above the largest bucket. */
function niceMax(maxMs: number): number {
  const steps = [15, 30, 60, 120, 180, 240, 360, 480, 600, 720, 960, 1440].map((m) => m * MINUTE)
  const yearSteps = [10, 20, 40, 60, 80, 100, 150, 200, 300, 400, 600].map((h) => h * HOUR)
  for (const s of [...steps, ...yearSteps]) if (maxMs <= s) return s
  return Math.ceil(maxMs / (100 * HOUR)) * 100 * HOUR
}

function axisLabel(ms: number): string {
  if (ms === 0) return '0'
  return ms < HOUR ? `${Math.round(ms / MINUTE)}m` : `${+(ms / HOUR).toFixed(1)}h`
}

function showTick(period: Period, i: number): boolean {
  if (period === 'day') return i % 6 === 0
  if (period === 'month') return i % 7 === 0
  return true
}

/** Single-series bar chart of focus time per bucket. Tap a bar for its value. */
export function BarChart({ buckets, period }: { buckets: Bucket[]; period: Period }) {
  const [selected, setSelected] = useState<number | null>(null)
  const max = niceMax(Math.max(...buckets.map((b) => b.ms), 1))
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const slot = innerW / buckets.length
  const gap = Math.min(2, slot * 0.2)
  const barW = Math.max(1, slot - gap)
  const y = (ms: number) => PAD.top + innerH - (ms / max) * innerH
  const sel = selected != null ? buckets[selected] : null

  return (
    <figure className="chart">
      <div className="chart-readout" aria-live="polite">
        {sel ? (
          <>
            <span>{sel.title}</span>
            <strong>{formatDuration(sel.ms)}</strong>
          </>
        ) : (
          <span className="hint">Tap a bar for details</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Focus time per period" onPointerLeave={(e) => e.pointerType === 'mouse' && setSelected(null)}>
        {[0, max / 2, max].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x={PAD.left - 6} y={y(v) + 3.5} className="chart-axis" textAnchor="end">{axisLabel(v)}</text>
          </g>
        ))}
        {buckets.map((b, i) => {
          const x = PAD.left + i * slot + gap / 2
          const h = (b.ms / max) * innerH
          const r = Math.min(4, barW / 2, h)
          const top = PAD.top + innerH - h
          const base = PAD.top + innerH
          return (
            <g key={b.start}>
              {h > 0 && (
                <path
                  className={`chart-bar${selected === i ? ' selected' : ''}${selected != null && selected !== i ? ' dim' : ''}`}
                  d={`M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${base} Z`}
                />
              )}
              {showTick(period, i) && (
                <text x={x + barW / 2} y={H - 6} className="chart-axis" textAnchor="middle">{b.label}</text>
              )}
              {/* Hit target: the whole column, bigger than the bar. */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onClick={() => setSelected(i)}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setSelected(i)}
              >
                <title>{`${b.title}: ${formatDuration(b.ms)}`}</title>
              </rect>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
