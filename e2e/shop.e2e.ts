import { expectCoins, expect, logSession, tab, test } from './fixtures'

test.describe('coins and shop', () => {
  test('buying a tree spends coins and equips it', async ({ app }) => {
    await logSession(app, { date: '2026-10-20', time: '09:00', quick: '3h' })
    await expectCoins(app, 180)

    await tab(app, 'Shop')
    await app.locator('.shop-card', { hasText: 'Birch' }).click()
    const sheet = app.getByRole('dialog', { name: 'Unlock this tree?' })
    await sheet.getByRole('button', { name: 'Unlock' }).click()
    await expect(sheet).toBeHidden()
    await expect(app.locator('.shop-card', { hasText: 'Birch' })).toContainText('In use')
    await expectCoins(app, 30)
    await expect(app.locator('.tree-stage-name')).toContainText('Birch')
  })

  test('items you can’t afford can’t be bought', async ({ app }) => {
    await tab(app, 'Shop')
    await app.locator('.shop-card', { hasText: 'Golden Tree' }).click()
    const sheet = app.getByRole('dialog', { name: 'Unlock this tree?' })
    await expect(sheet).toContainText('2,500 more coins — about 42 hours of focus.')
    await expect(sheet.getByRole('button', { name: 'Unlock' })).toBeDisabled()
  })

  test('a bought theme recolours the app and survives a reload', async ({ app }) => {
    await logSession(app, { date: '2026-10-20', time: '05:00', quick: '3h' })
    await logSession(app, { date: '2026-10-20', time: '09:00', quick: '3h' })
    await logSession(app, { date: '2026-10-19', time: '09:00', quick: '3h' })
    await tab(app, 'Shop')
    await app.getByRole('tab', { name: 'Themes' }).click()
    await app.locator('.shop-card', { hasText: 'Night Forest' }).click()
    await app.getByRole('dialog').getByRole('button', { name: 'Unlock' }).click()
    const bg = () => app.evaluate(() => getComputedStyle(document.body).backgroundColor)
    await expect.poll(bg).toBe('rgb(21, 32, 25)')
    await app.reload()
    await expect.poll(bg).toBe('rgb(21, 32, 25)')
  })
})
