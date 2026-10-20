export const THEME_IDS = ['meadow', 'autumn', 'winter', 'sakura', 'night'] as const
export type ThemeId = (typeof THEME_IDS)[number]

/** Names live in the i18n dictionaries, keyed by id. */
export interface Theme {
  id: ThemeId
  price: number
  dark: boolean
  /** CSS custom properties applied to :root. */
  vars: Record<string, string>
}

const base = {
  '--bg': '#f4f1e4',
  '--surface': '#fffdf6',
  '--surface-2': '#ece7d4',
  '--ink': '#2e3a2a',
  '--ink-2': '#5e6a58',
  '--ink-3': '#8b937f',
  '--accent': '#5b9a54',
  '--accent-ink': '#ffffff',
  '--accent-soft': '#dcebc9',
  '--ground': '#b7d38b',
  '--ground-2': '#9cc06f',
  '--sky': '#e7f1d9',
  '--danger': '#c4553f',
  '--coin': '#e0a526',
  '--line': 'rgba(46, 58, 42, 0.12)',
}

export const THEMES: Theme[] = [
  { id: 'meadow', price: 0, dark: false, vars: base },
  {
    id: 'autumn', price: 300, dark: false,
    vars: { ...base, '--bg': '#f6eee2', '--surface-2': '#efe1cc', '--accent': '#c8693a', '--accent-soft': '#f4d9c2', '--ground': '#d9b06b', '--ground-2': '#c7924f', '--sky': '#f7e6d2' },
  },
  {
    id: 'winter', price: 300, dark: false,
    vars: { ...base, '--bg': '#eef3f5', '--surface': '#fbfdfe', '--surface-2': '#dfe8ec', '--ink': '#25343b', '--ink-2': '#56666d', '--accent': '#4f8aa6', '--accent-soft': '#d3e5ee', '--ground': '#f4f8fa', '--ground-2': '#d8e4ea', '--sky': '#dfebf1' },
  },
  {
    id: 'sakura', price: 500, dark: false,
    vars: { ...base, '--bg': '#fbf0f2', '--surface-2': '#f3dfe3', '--accent': '#cc6b8a', '--accent-soft': '#f6d6e0', '--ground': '#c9dba0', '--ground-2': '#afc885', '--sky': '#fae3ea' },
  },
  {
    id: 'night', price: 500, dark: true,
    vars: {
      ...base, '--bg': '#152019', '--surface': '#1e2b22', '--surface-2': '#273629', '--ink': '#e7efe1', '--ink-2': '#b1bfa9', '--ink-3': '#7f8e78',
      '--accent': '#7dbb6c', '--accent-ink': '#10180f', '--accent-soft': '#2c4229', '--ground': '#2f4a2c', '--ground-2': '#253d23', '--sky': '#1b2a2a',
      '--line': 'rgba(231, 239, 225, 0.12)',
    },
  },
]

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

/** Categorical colours for tags, assigned in fixed order. Light / dark steps. */
export const TAG_COLORS: { light: string; dark: string }[] = [
  { light: '#2a78d6', dark: '#3987e5' },
  { light: '#eb6834', dark: '#d95926' },
  { light: '#1baf7a', dark: '#199e70' },
  { light: '#eda100', dark: '#c98500' },
  { light: '#e87ba4', dark: '#d55181' },
  { light: '#008300', dark: '#008300' },
  { light: '#6250d6', dark: '#9085e9' },
  { light: '#e34948', dark: '#e66767' },
]
