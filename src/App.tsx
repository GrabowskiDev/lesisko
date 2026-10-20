import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings, requestPersistentStorage } from './db'
import { getTheme } from './data/themes'
import { I18nProvider, useI18n } from './i18n'
import { loadActive, saveActive } from './lib/activeSession'
import { Running } from './components/Running'
import { Icon } from './components/ui'
import { FocusScreen } from './screens/FocusScreen'
import { ForestScreen } from './screens/ForestScreen'
import { StatsScreen } from './screens/StatsScreen'
import { ShopScreen } from './screens/ShopScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import type { ActiveSession, Settings } from './types'

type Tab = 'focus' | 'forest' | 'stats' | 'shop' | 'settings'

const TABS: { id: Tab; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'focus', icon: 'timer' },
  { id: 'forest', icon: 'forest' },
  { id: 'stats', icon: 'stats' },
  { id: 'shop', icon: 'shop' },
  { id: 'settings', icon: 'settings' },
]

export function App() {
  // Wait for real settings before rendering: the penalty rules must be known before
  // a restored session judges time spent away.
  const settings = useLiveQuery(getSettings)
  const language = settings?.language

  useEffect(() => {
    void requestPersistentStorage()
  }, [])

  useEffect(() => {
    if (language) document.documentElement.lang = language
  }, [language])

  const themeId = settings?.themeId
  useEffect(() => {
    const theme = getTheme(themeId ?? 'meadow')
    const root = document.documentElement
    for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v)
    root.style.colorScheme = theme.dark ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.vars['--bg'])
  }, [themeId])

  if (!settings) return null
  return (
    <I18nProvider lang={settings.language}>
      <Main settings={settings} />
    </I18nProvider>
  )
}

function Main({ settings }: { settings: Settings }) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('focus')
  const [active, setActive] = useState<ActiveSession | null>(loadActive)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  if (active) {
    return <Running active={active} settings={settings} onClose={() => setActive(null)} />
  }

  return (
    <div className="app">
      <main>
        {tab === 'focus' && (
          <FocusScreen
            settings={settings}
            onStart={(a) => {
              saveActive(a)
              setActive(a)
            }}
            onOpenSettings={() => setTab('settings')}
          />
        )}
        {tab === 'forest' && <ForestScreen />}
        {tab === 'stats' && <StatsScreen />}
        {tab === 'shop' && <ShopScreen />}
        {tab === 'settings' && <SettingsScreen settings={settings} />}
      </main>
      <nav className="tab-bar">
        {TABS.map((item) => (
          <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)} aria-current={tab === item.id ? 'page' : undefined}>
            <Icon name={item.icon} />
            <span>{t.tabs[item.id]}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
