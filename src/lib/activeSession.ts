import type { ActiveSession } from '../types'

// The running session is kept in localStorage rather than IndexedDB because it is
// written from `visibilitychange`, where iOS may suspend us before an async write lands.
const KEY = 'lesisko.active'

export function loadActive(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ActiveSession) : null
  } catch {
    return null
  }
}

export function saveActive(active: ActiveSession | null): void {
  try {
    if (active) localStorage.setItem(KEY, JSON.stringify(active))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage unavailable (private mode); the session still works in memory.
  }
}
