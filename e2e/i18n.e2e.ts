import { expect, logSession, tab, test } from './fixtures'

test.describe('languages', () => {
  test.describe('on a Polish phone', () => {
    test.use({ locale: 'pl-PL' })

    test('starts in Polish with Polish dates and plurals', async ({ app }) => {
      await expect(app.getByRole('button', { name: 'Posadź' })).toBeVisible()
      await expect(app.locator('.tab-bar')).toContainText('Ustawienia')
      await app.getByRole('button', { name: 'Dodaj czas ręcznie' }).click()
      const sheet = app.getByRole('dialog', { name: 'Dodaj czas skupienia' })
      await sheet.getByLabel('Początek').fill('09:00')
      await sheet.getByRole('button', { name: 'Dodaj 1 h' }).click()
      await tab(app, 'Las')
      await expect(app.locator('.forest-summary')).toContainText('1 drzewo · 1 h skupienia')
      await expect(app.locator('.day-group h3')).toContainText('Wtorek, 20 paź')
      await tab(app, 'Statystyki')
      await app.getByRole('tab', { name: 'Miesiąc' }).click()
      await expect(app.locator('.period-label')).toHaveText('Październik 2026')
    })
  })

  test('switching language changes the whole app and is remembered', async ({ app }) => {
    await tab(app, 'Settings')
    await app.getByRole('tab', { name: 'Polski' }).click()
    await expect(app.locator('.tab-bar')).toContainText('Skupienie')
    await expect(app.locator('html')).toHaveAttribute('lang', 'pl')
    await app.reload()
    await expect(app.getByRole('button', { name: 'Posadź' })).toBeVisible()
    await tab(app, 'Ustawienia')
    await app.getByRole('tab', { name: 'English' }).click()
    await expect(app.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('the app-blocking guide opens with all four steps', async ({ app }) => {
    await tab(app, 'Settings')
    await app.getByRole('button', { name: 'Show me how' }).click()
    const guide = app.getByRole('dialog', { name: 'Block distracting apps' })
    await expect(guide.locator('.guide-steps > li')).toHaveCount(4)
    await expect(guide.locator('.guide-actions li')).toHaveCount(5)
    await expect(guide).toContainText('Go to Home Screen')
  })

  test('plural forms in English', async ({ app }) => {
    await logSession(app, { date: '2026-10-20', time: '09:00', quick: '1h' })
    await tab(app, 'Forest')
    await expect(app.locator('.forest-summary')).toContainText('1 tree · 1h focused')
  })
})
