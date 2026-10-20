import type { ReactNode } from 'react'
import type { Species } from '../data/species'

interface Props {
  species: Species
  /** 0 = just planted, 1 = fully grown. */
  growth?: number
  withered?: boolean
  size?: number | string
  className?: string
}

interface Palette {
  trunk: string
  leaf: string
  leafLight: string
  accent: string
}

const WITHERED: Palette = { trunk: '#6e5b4b', leaf: '#a38d63', leafLight: '#bba77f', accent: '#cbbd9c' }

// Everything is drawn on a 100×120 canvas with the trunk rooted at (50, 110).
export function Tree({ species, growth = 1, withered = false, size = 100, className }: Props) {
  const p: Palette = withered
    ? WITHERED
    : { trunk: species.trunk, leaf: species.leaf, leafLight: species.leafLight, accent: species.accent ?? species.leafLight }
  const g = Math.min(1, Math.max(0, growth))
  const sprout = g < 0.15
  const scale = sprout ? 0.4 + g * 4 : 0.3 + 0.7 * easeOut((g - 0.15) / 0.85)

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={typeof size === 'number' ? size * 1.2 : undefined}
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="50" cy="110" rx={sprout ? 10 : 8 + 16 * scale} ry="3.5" fill="rgba(0,0,0,0.12)" />
      <g
        transform={`translate(50 110) scale(${scale}) translate(-50 -110)`}
        style={{ transition: 'transform 1s ease-out' }}
      >
        {sprout ? <Sprout p={p} withered={withered} /> : SHAPES[species.shape](p, withered)}
      </g>
    </svg>
  )
}

function easeOut(t: number): number {
  return 1 - (1 - t) ** 2
}

function Sprout({ p, withered }: { p: Palette; withered: boolean }) {
  return (
    <g>
      <path d="M50 110 Q50 98 50 92" stroke={withered ? p.trunk : '#6b9a4a'} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="43" cy="92" rx="8" ry="4.5" fill={p.leaf} transform="rotate(-25 43 92)" />
      <ellipse cx="57" cy="90" rx="8" ry="4.5" fill={p.leafLight} transform="rotate(25 57 90)" />
    </g>
  )
}

const SHAPES: Record<Species['shape'], (p: Palette, withered: boolean) => ReactNode> = {
  round: (p) => (
    <g>
      <rect x="45.5" y="66" width="9" height="44" rx="3" fill={p.trunk} />
      <path d="M50 84 L40 74" stroke={p.trunk} strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="48" r="27" fill={p.leaf} />
      <circle cx="33" cy="60" r="16" fill={p.leaf} />
      <circle cx="67" cy="58" r="17" fill={p.leaf} />
      <circle cx="42" cy="40" r="13" fill={p.leafLight} />
      <circle cx="62" cy="45" r="7" fill={p.leafLight} opacity="0.7" />
      {p.accent !== p.leafLight && <circle cx="38" cy="36" r="4" fill={p.accent} opacity="0.8" />}
    </g>
  ),
  pine: (p) => {
    const tiers: [number, number, number][] = [
      [50, 95, 34],
      [36, 76, 28],
      [20, 57, 21],
    ]
    return (
      <g>
        <rect x="46.5" y="88" width="7" height="22" rx="2" fill={p.trunk} />
        {tiers.map(([top, bottom, half]) => (
          <g key={top}>
            <polygon points={`50,${top} ${50 + half},${bottom} ${50 - half},${bottom}`} fill={p.leaf} strokeLinejoin="round" stroke={p.leaf} strokeWidth="3" />
            <polygon points={`50,${top} 50,${bottom} ${50 - half},${bottom}`} fill={p.leafLight} opacity="0.55" />
            {p.accent !== p.leafLight && (
              <polygon points={`50,${top} ${50 + half * 0.35},${top + (bottom - top) * 0.35} ${50 - half * 0.35},${top + (bottom - top) * 0.35}`} fill={p.accent} opacity="0.9" />
            )}
          </g>
        ))}
      </g>
    )
  },
  tall: (p) => (
    <g>
      <rect x="46.5" y="36" width="7" height="74" rx="3" fill={p.trunk} />
      {[52, 64, 78, 92].map((y, i) => (
        <rect key={y} x={i % 2 ? 50 : 46.5} y={y} width="3.5" height="1.6" rx="0.8" fill={p.accent} opacity="0.7" />
      ))}
      <ellipse cx="50" cy="40" rx="19" ry="32" fill={p.leaf} />
      <ellipse cx="44" cy="32" rx="9" ry="18" fill={p.leafLight} />
    </g>
  ),
  blossom: (p, withered) => (
    <g>
      <path d="M50 110 L50 72 M50 84 L37 70 M50 78 L64 66" stroke={p.trunk} strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="50" r="25" fill={p.leaf} />
      <circle cx="31" cy="60" r="15" fill={p.leaf} />
      <circle cx="69" cy="57" r="16" fill={p.leaf} />
      <circle cx="43" cy="41" r="12" fill={p.leafLight} />
      <circle cx="64" cy="46" r="8" fill={p.leafLight} />
      {!withered &&
        [[38, 55], [56, 36], [70, 60], [28, 64], [50, 62], [60, 52], [44, 30]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill={p.accent} opacity="0.9" />
        ))}
    </g>
  ),
  palm: (p, withered) => (
    <g>
      <path d="M50 110 Q46 78 56 40" stroke={p.trunk} strokeWidth="7" strokeLinecap="round" fill="none" />
      {[-150, -110, -70, -30, 10, 200].map((angle) => (
        <ellipse key={angle} cx="56" cy="40" rx="24" ry="6" fill={angle % 20 ? p.leaf : p.leafLight} transform={`rotate(${angle} 56 40) translate(20 0)`} />
      ))}
      {!withered && (
        <>
          <circle cx="53" cy="45" r="3.5" fill="#7a5130" />
          <circle cx="59" cy="46" r="3.5" fill="#6a4426" />
        </>
      )}
    </g>
  ),
  cactus: (p, withered) => (
    <g>
      <rect x="41" y="40" width="18" height="70" rx="9" fill={p.leaf} />
      <path d="M41 78 H32 Q27 78 27 72 V58" stroke={p.leaf} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M59 70 H67 Q72 70 72 64 V52" stroke={p.leaf} strokeWidth="9" strokeLinecap="round" fill="none" />
      <rect x="45" y="44" width="4" height="62" rx="2" fill={p.leafLight} opacity="0.6" />
      {!withered && <circle cx="50" cy="39" r="5" fill={p.accent} />}
    </g>
  ),
  flower: (p) => (
    <g>
      <path d="M50 110 Q48 80 50 44" stroke={p.trunk} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="84" rx="10" ry="4.5" fill={p.trunk} transform="rotate(-30 40 84)" />
      <ellipse cx="60" cy="74" rx="10" ry="4.5" fill={p.trunk} transform="rotate(30 60 74)" />
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx="50" cy="38" rx="5" ry="13" fill={i % 2 ? p.leaf : p.leafLight} transform={`rotate(${i * 30} 50 38) translate(0 -12)`} />
      ))}
      <circle cx="50" cy="38" r="10" fill={p.accent} />
    </g>
  ),
  mushroom: (p, withered) => (
    <g>
      <rect x="41" y="66" width="18" height="44" rx="7" fill={p.trunk} />
      <path d="M16 72 Q18 30 50 28 Q82 30 84 72 Z" fill={p.leaf} />
      <path d="M22 62 Q28 36 50 33" stroke={p.leafLight} strokeWidth="5" fill="none" strokeLinecap="round" />
      {!withered &&
        [[36, 50, 5], [60, 42, 6], [70, 60, 4], [48, 62, 3.5]].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={p.accent} />
        ))}
    </g>
  ),
}
