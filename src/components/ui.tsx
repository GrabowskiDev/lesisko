import { useEffect, type ReactNode } from 'react'
import { periodLabel, type Period } from '../lib/time'

export function Sheet({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {title && <h2 className="sheet-title">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, small }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  small?: boolean
}) {
  return (
    <div className={`segmented${small ? ' small' : ''}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          className={o.value === value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

export function PeriodNav({ period, anchor, onShift, onReset }: {
  period: Period
  anchor: Date
  onShift: (dir: 1 | -1) => void
  onReset: () => void
}) {
  return (
    <div className="period-nav">
      <button className="icon-btn" onClick={() => onShift(-1)} aria-label="Previous">
        <Icon name="chevron-left" />
      </button>
      <button className="period-label" onClick={onReset}>{periodLabel(period, anchor)}</button>
      <button className="icon-btn" onClick={() => onShift(1)} aria-label="Next">
        <Icon name="chevron-right" />
      </button>
    </div>
  )
}

export function CoinBadge({ coins }: { coins: number }) {
  return (
    <span className="coin-badge">
      <CoinIcon /> {coins.toLocaleString()}
    </span>
  )
}

export function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="var(--coin)" />
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="#fff6d6" strokeWidth="1.5" opacity="0.8" />
      <path d="M6.8 13.2c0-3.6 2.8-6.4 6.4-6.4 0 3.6-2.8 6.4-6.4 6.4z" fill="#fff6d6" />
    </svg>
  )
}

const ICONS: Record<string, ReactNode> = {
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9.5 2.5h5" /></>,
  forest: <><path d="M8 21v-5M16 21v-3" /><path d="M8 3 3.5 12h9z" /><circle cx="16" cy="11.5" r="5" /></>,
  stats: <><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></>,
  shop: <><path d="M4 8h16l-1.5 12h-13z" /><path d="M8.5 8a3.5 3.5 0 0 1 7 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  'chevron-left': <path d="m15 5-7 7 7 7" />,
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
}

export function Icon({ name, size = 22 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} className={`toggle${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  )
}
