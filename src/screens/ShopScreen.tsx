import { useState } from 'react'
import { SPECIES, type Species } from '../data/species'
import { THEMES, type Theme } from '../data/themes'
import { updateSettings } from '../db'
import { useI18n } from '../i18n'
import { buy, NotEnoughCoins, useCoins, useOwns, useSettings } from '../store'
import { Tree } from '../components/Tree'
import { CoinIcon, Segmented, Sheet } from '../components/ui'

type Item = { kind: 'tree'; item: Species } | { kind: 'theme'; item: Theme }

export function ShopScreen() {
  const { t: { shop: t, species, themes }, number } = useI18n()
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
      setError(e instanceof NotEnoughCoins ? t.notEnough : String(e))
    }
  }

  const nameOf = (it: Item) => (it.kind === 'tree' ? species[it.item.id].name : themes[it.item.id])

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
        <strong>{nameOf(it)}</strong>
        {equipped ? (
          <span className="shop-state">{t.inUse}</span>
        ) : owned ? (
          <span className="shop-state owned">{t.owned}</span>
        ) : (
          <span className={`price${coins >= item.price ? '' : ' locked'}`}><CoinIcon size={14} /> {number(item.price)}</span>
        )}
      </button>
    )
  }

  return (
    <div className="screen">
      <header className="top-bar">
        <h1>{t.title}</h1>
      </header>

      <section className="hero card">
        <span className="label">{t.yourCoins}</span>
        <strong className="hero-number"><CoinIcon size={30} /> {number(coins)}</strong>
        <span className="hint">{t.earnHint}</span>
      </section>

      <Segmented value={tab} onChange={setTab} options={[{ value: 'trees', label: t.trees }, { value: 'themes', label: t.themes }]} />

      <div className="shop-grid">
        {tab === 'trees'
          ? SPECIES.map((s) => card({ kind: 'tree', item: s }))
          : THEMES.map((t) => card({ kind: 'theme', item: t }))}
      </div>

      <Sheet open={buying != null} onClose={() => setBuying(null)} title={buying?.kind === 'theme' ? t.unlockTheme : t.unlockTree}>
        {buying && (
          <div className="buy-sheet">
            {buying.kind === 'tree' ? <Tree species={buying.item} size={120} /> : <ThemeSwatch theme={buying.item} large />}
            <strong className="buy-name">{nameOf(buying)}</strong>
            {buying.kind === 'tree' && <p className="hint center">{species[buying.item.id].blurb}</p>}
            <p className="center">
              {t.costs} <strong><CoinIcon size={14} /> {number(buying.item.price)}</strong> · {t.youHave(number(coins))}
            </p>
            {coins < buying.item.price && (
              <p className="hint center">
                {t.missing(buying.item.price - coins, Math.ceil((buying.item.price - coins) / 60))}
              </p>
            )}
            {error && <p className="warning">{error}</p>}
            <button className="btn primary block" disabled={coins < buying.item.price} onClick={() => void confirm()}>
              {t.unlock}
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
