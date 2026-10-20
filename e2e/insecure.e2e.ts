import { expect, expectCoins, logSession, setMinutes, tab, test } from './fixtures'

// Opening the dev server from a phone over Wi-Fi (http://192.168.x.x) is not a "secure context",
// so browsers hide crypto.randomUUID there. Saving used to crash silently: "Give up" did nothing.
test('everything still saves on a plain-HTTP address', async ({ app }) => {
  await app.addInitScript(() => {
    delete (Crypto.prototype as { randomUUID?: unknown }).randomUUID
  })
  await app.reload()
  expect(await app.evaluate(() => typeof crypto.randomUUID)).toBe('undefined')

  await app.getByRole('button', { name: 'Plant' }).click()
  await app.getByRole('button', { name: 'Give up' }).click()
  await app.getByRole('dialog', { name: 'Give up on this tree?' }).getByRole('button', { name: 'Give up' }).click()
  await expect(app.getByRole('heading', { name: 'Your tree withered' })).toBeVisible()
  await app.getByRole('button', { name: 'Try again' }).click()

  await setMinutes(app, 5)
  await app.getByRole('button', { name: 'Plant' }).click()
  await app.clock.fastForward(5 * 60_000)
  await expect(app.getByRole('heading', { name: 'Tree planted!' })).toBeVisible()
  await app.getByRole('button', { name: 'Back to my forest' }).click()

  await logSession(app, { date: '2026-10-20', time: '09:00', quick: '1h' })
  await tab(app, 'Settings')
  await app.getByPlaceholder('New tag').fill('Math')
  await app.locator('.tag-add').getByRole('button', { name: 'Add' }).click()
  await expect(app.getByLabel('Tag name')).toHaveValue('Math')

  await expectCoins(app, 65)
})
