import type { Language } from '../types'

/** Polish if the device prefers Polish, English otherwise. */
export function detectLanguage(): Language {
  const preferred = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  return preferred.some((l) => l?.toLowerCase().startsWith('pl')) ? 'pl' : 'en'
}
