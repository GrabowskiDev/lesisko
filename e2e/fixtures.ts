import { test as base, expect, type Page } from '@playwright/test'

/** 14:00 on a Tuesday, so "today", "this week" etc. are predictable. */
export const NOW = new Date(2026, 9, 20, 14, 0)

export const test = base.extend<{ app: Page }>({
  // A fresh app with a controllable clock that fails the test on any uncaught page error.
  app: async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.clock.install({ time: NOW })
    await page.goto('/')
    await expect(page.locator('.tab-bar')).toBeVisible()
    await use(page)
    expect(errors, 'uncaught errors in the page').toEqual([])
  },
})

export { expect }

/**
 * Fires the same event iOS fires when the phone is locked or another app is opened
 * (and again when coming back), so the app's real handlers run.
 */
export async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((h) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h })
    document.dispatchEvent(new Event('visibilitychange'))
  }, hidden)
}

/** Leaves the app for `ms` (fake time) and comes back. */
export async function goAway(page: Page, ms: number): Promise<void> {
  await setHidden(page, true)
  await page.clock.fastForward(ms)
  await setHidden(page, false)
}

export const MIN = 60_000

export async function tab(page: Page, name: string): Promise<void> {
  await page.locator('.tab-bar').getByRole('button', { name }).click()
}

/** Checks the coin balance shown on the Focus screen. */
export async function expectCoins(page: Page, n: number): Promise<void> {
  await tab(page, 'Focus')
  await expect(page.locator('.coin-badge')).toHaveText(n.toLocaleString('en'))
}

/** Sets the countdown slider (5–180, step 5) using the keyboard like a real user would. */
export async function setMinutes(page: Page, minutes: number): Promise<void> {
  const slider = page.getByLabel('Session length in minutes')
  await slider.focus()
  const current = Number(await slider.inputValue())
  const steps = (minutes - current) / 5
  for (let i = 0; i < Math.abs(steps); i++) await slider.press(steps > 0 ? 'ArrowRight' : 'ArrowLeft')
  await expect(page.locator('.clock')).toHaveText(`${minutes}:00`)
}

/** Logs a forgotten session through the "Log time" sheet. */
export async function logSession(page: Page, opts: { date: string; time: string; quick: string }): Promise<void> {
  await tab(page, 'Focus')
  await page.getByRole('button', { name: 'Log time I forgot to track' }).click()
  const sheet = page.getByRole('dialog', { name: 'Log focus time' })
  await sheet.getByLabel('Date').fill(opts.date)
  await sheet.getByLabel('Started at').fill(opts.time)
  await sheet.getByRole('button', { name: opts.quick, exact: true }).click()
  await sheet.getByRole('button', { name: `Add ${opts.quick}` }).click()
  await expect(sheet).toBeHidden()
}

export async function setPenalty(page: Page, mode: 'Off' | 'Ask me' | 'Strict'): Promise<void> {
  await tab(page, 'Settings')
  await page.getByRole('tab', { name: mode }).click()
  await tab(page, 'Focus')
}
