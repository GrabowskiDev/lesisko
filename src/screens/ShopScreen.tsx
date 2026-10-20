import { useState } from 'react'
import { SPECIES, type Species } from '../data/species'
import { THEMES, type Theme } from '../data/themes'
import { updateSettings } from '../db'
import { buy, NotEnoughCoins, useCoins, useOwns, useSettings } from '../store'
import { Tree } from '../components/Tree'
import { CoinIcon, Segmented, Sheet } from '../components/ui'

type Item = { kind: 'tree'; item: Species } | { kind: 'theme'; item: Theme }

export function ShopScreen() {
  const coins = useCoins()
  const owns = useOwns()
  const settings = useSettings()
  const [tab, setTab] = useState<'trees' | 'themes'>('trees')
  const [buying, setBuying] = useState<Item | null>(null)
  const [error, setError] = useState<string | null>(null)

  const equip = (it: Item) =>
    updateSettings(it.kind === 'tree' ? { speciesId: it.item.id } : { themeId: it.item.id })

  const confirm = async () => {
    if (!buying) return
    try {
      await buy(buying.item.id, buying.item.price)
      await equip(buying)
      setBuying(null)
    } catch (e) {
      setError(e instanceof NotEnoughCoins ? 'Not enough coins yet — keep focusing!' : String(e))
    }
  }

  const card = (it: Item) => {
    const { item } = it
    const owned = owns(item)
    const equipped = it.kind === 'tree' ? settings.speciesId === item.id : settings.themeId === item.id
    return (
      <button
        key={item.id}
        className={`shop-card card${equipped ? ' equipped' : ''}`}
        onClick={() => (owned ? void equip(it) : (setError(null), setBuying(it)))}
      >
        {it.kind === 'tree' ? (
          <Tree species={it.item} size={72} />
        ) : (
          <ThemeSwatch theme={it.item} />
        )}
        <strong>{item.name}</strong>
        {equipped ? (
          <span className="shop-state">In use</span>
        ) : owned ? (
          <span className="shop-state owned">Owned · tap to use</span>
        ) : (
          <span className={`price${coins >= item.price ? '' : ' locked'}`}><CoinIcon size={14} /> {item.price}</span>
        )}
      </button>
    )
  }

  return (
    <div className="screen">
      <header className="top-bar">
        <h1>Shop</h1>
      </header>

      <section className="hero card">
        <span className="label">Your coins</span>
        <strong className="hero-number"><CoinIcon size={30} /> {coins.toLocaleString()}</strong>
        <span className="hint">You earn 1 coin for every minute of focus.</span>
      </section>

      <Segmented value={tab} onChange={setTab} options={[{ value: 'trees', label: 'Trees' }, { value: 'themes', label: 'Themes' }]} />

      <div className="shop-grid">
        {tab === 'trees'
          ? SPECIES.map((s) => card({ kind: 'tree', item: s }))
          : THEMES.map((t) => card({ kind: 'theme', item: t }))}
      </div>

      <Sheet open={buying != null} onClose={() => setBuying(null)} title={buying ? `Unlock ${buying.item.name}?` : undefined}>
        {buying && (
          <div className="buy-sheet">
            {buying.kind === 'tree' ? <Tree species={buying.item} size={120} /> : <ThemeSwatch theme={buying.item} large />}
            {buying.kind === 'tree' && <p className="hint center">{buying.item.blurb}</p>}
            <p className="center">
              Costs <strong><CoinIcon size={14} /> {buying.item.price}</strong> · you have {coins.toLocaleString()}
            </p>
            {coins < buying.item.price && (
              <p className="hint center">
                {buying.item.price - coins} more coins — about {Math.ceil((buying.item.price - coins) / 60)}h of focus.
              </p>
            )}
            {error && <p className="warning">{error}</p>}
            <button className="btn primary block" disabled={coins < buying.item.price} onClick={() => void confirm()}>
              Unlock
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function ThemeSwatch({ theme, large }: { theme: Theme; large?: boolean }) {
  const v = theme.vars
  return (
    <div className={`theme-swatch${large ? ' large' : ''}`} style={{ background: v['--sky'] }}>
      <span style={{ background: v['--accent'] }} />
      <div style={{ background: v['--ground'] }} />
    </div>
  )
}
