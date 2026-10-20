import { expectCoins, expect, goAway, MIN, setHidden, setMinutes, setPenalty, tab, test } from './fixtures'

test.describe('focus timer', () => {
  test('a countdown completes, plants a tree and pays coins', async ({ app }) => {
    await setMinutes(app, 5)
    await app.getByRole('button', { name: 'Plant' }).click()
    await expect(app.locator('.clock')).toHaveText(/^[45]:\d\d$/)
    await app.clock.fastForward(5 * MIN)
    await expect(app.getByRole('heading', { name: 'Tree planted!' })).toBeVisible()
    await expect(app.locator('.coin-earned')).toHaveText('+5')
    await app.getByRole('button', { name: 'Back to my forest' }).click()
    await expectCoins(app, 5)
    await expect(app.locator('.today-total')).toHaveText('5m')
  })

  test('short absences past the grace period are shown in seconds', async ({ app }) => {
    await app.getByRole('button', { name: 'Plant' }).click()
    await goAway(app, 15_000)
    await expect(app.locator('.checkin-text')).toContainText(/away for 1[56]s\./)
  })

  test('a quick peek inside the grace period is ignored', async ({ app }) => {
    await app.getByRole('button', { name: 'Plant' }).click()
    await goAway(app, 5_000)
    await expect(app.getByRole('dialog')).toBeHidden()
    await expect(app.locator('.clock')).toBeVisible()
  })

  test('"Ask me": coming back asks, and "Yes" keeps the tree growing', async ({ app }) => {
    await app.getByRole('button', { name: 'Plant' }).click()
    await goAway(app, 4 * MIN)
    const checkIn = app.getByRole('dialog', { name: /Welcome back/ })
    await expect(checkIn).toContainText('You were away for 4m')
    await checkIn.getByRole('button', { name: /Yes, I was focusing/ }).click()
    await expect(checkIn).toBeHidden()
    await app.clock.fastForward(25 * MIN)
    await expect(app.getByRole('heading', { name: 'Tree planted!' })).toBeVisible()
    await expect(app.locator('.coin-earned')).toHaveText('+25')
  })

  test('"Ask me": "I got distracted" withers the tree and pays nothing', async ({ app }) => {
    await app.getByRole('button', { name: 'Plant' }).click()
    await goAway(app, 3 * MIN)
    await app.getByRole('button', { name: /I got distracted/ }).click()
    await expect(app.getByRole('heading', { name: 'Your tree withered' })).toBeVisible()
    await app.getByRole('button', { name: 'Try again' }).click()
    await expectCoins(app, 0)
  })

  test('a countdown that ends while the phone is locked only counts time before the end', async ({ app }) => {
    await app.getByRole('button', { name: 'Plant' }).click()
    await app.clock.fastForward(20 * MIN)
    await goAway(app, 60 * MIN) // locked at 20:00, timer ended at 25:00, back at 80:00
    // Real time keeps ticking a little between fake-clock jumps, so 4:59 shows as "4m".
    await expect(app.getByRole('dialog', { name: /Welcome back/ })).toContainText(/away for [45]m\./)
    await app.getByRole('button', { name: /Yes, I was focusing/ }).click()
    await expect(app.getByRole('heading', { name: 'Tree planted!' })).toBeVisible()
    await expect(app.locator('.result-stats')).toContainText('25m focused')
  })

  test('the app being killed in the background still asks on relaunch', async ({ app }) => {
    await app.getByRole('button', { name: 'Plant' }).click()
    await setHidden(app, true)
    await app.clock.fastForward(4 * MIN)
    await app.reload()
    await expect(app.getByRole('dialog', { name: /Welcome back/ })).toContainText('away for 4m')
  })

  test('strict mode forgives short absences and withers long ones', async ({ app }) => {
    await setPenalty(app, 'Strict')
    await app.getByRole('button', { name: 'Plant' }).click()
    await expect(app.getByText('Away for more than 2 min and your tree withers.')).toBeVisible()
    await goAway(app, 1 * MIN)
    await expect(app.locator('.clock')).toBeVisible()
    await goAway(app, 3 * MIN)
    await expect(app.getByRole('heading', { name: 'Your tree withered' })).toBeVisible()
  })

  test('with the penalty off, leaving never matters', async ({ app }) => {
    await setPenalty(app, 'Off')
    await app.getByRole('button', { name: 'Plant' }).click()
    await goAway(app, 10 * MIN)
    await expect(app.getByRole('dialog')).toBeHidden()
    await app.clock.fastForward(15 * MIN)
    await expect(app.getByRole('heading', { name: 'Tree planted!' })).toBeVisible()
  })

  test('stopwatch: too short is refused, then a real session is saved', async ({ app }) => {
    await app.getByRole('tab', { name: 'Stopwatch' }).click()
    await app.getByRole('button', { name: 'Plant' }).click()
    await app.clock.fastForward(30_000)
    await app.getByRole('button', { name: 'I’m done' }).click()
    const tooShort = app.getByRole('dialog', { name: 'Too short for a tree' })
    await tooShort.getByRole('button', { name: 'Keep going' }).click()
    await app.clock.fastForward(20 * MIN)
    await expect(app.locator('.clock')).toHaveText(/^20:3\d$/)
    await app.getByRole('button', { name: 'I’m done' }).click()
    await expect(app.locator('.result-stats')).toContainText('20m focused')
  })

  test('if saving fails, the session keeps running and says so', async ({ app }) => {
    await app.getByRole('button', { name: 'Plant' }).click()
    await app.evaluate(() => {
      IDBObjectStore.prototype.put = () => { throw new Error('disk full') }
    })
    await app.getByRole('button', { name: 'Give up' }).click()
    await app.getByRole('dialog', { name: 'Give up on this tree?' }).getByRole('button', { name: 'Give up' }).click()
    await expect(app.getByRole('alert')).toHaveText('Couldn’t save this session. Please try again.')
    await expect(app.locator('.clock')).toBeVisible()
    expect(await app.evaluate(() => localStorage.getItem('better-forest.active'))).not.toBeNull()
  })

  test('a running tree without a tag can be given one', async ({ app }) => {
    await setMinutes(app, 5)
    await app.getByRole('button', { name: 'Plant' }).click()
    await app.getByRole('button', { name: 'Add a tag' }).click()
    const sheet = app.getByRole('dialog', { name: 'What are you focusing on?' })
    await sheet.getByRole('button', { name: 'New tag' }).click()
    await sheet.getByPlaceholder('Tag name').fill('Math')
    await sheet.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(sheet).toBeHidden()

    // Now that it has a tag, it can't be changed any more.
    await expect(app.locator('.running .chip')).toHaveText('Math')
    await expect(app.locator('.running').getByRole('button', { name: 'Math' })).toHaveCount(0)

    // The tag survives a reload mid-session and ends up on the saved tree.
    await app.reload()
    await expect(app.locator('.running .chip')).toHaveText('Math')
    await app.clock.fastForward(5 * MIN)
    await app.getByRole('button', { name: 'Back to my forest' }).click()
    await tab(app, 'Stats')
    await expect(app.locator('.tag-bars')).toContainText('Math')
  })

  test('a running tree that already has a tag keeps it', async ({ app }) => {
    await app.locator('.focus-controls').getByRole('button', { name: 'No tag' }).click()
    const sheet = app.getByRole('dialog', { name: 'What are you focusing on?' })
    await sheet.getByRole('button', { name: 'New tag' }).click()
    await sheet.getByPlaceholder('Tag name').fill('Thesis')
    await sheet.getByRole('button', { name: 'Add', exact: true }).click()
    await app.getByRole('button', { name: 'Plant' }).click()
    await expect(app.locator('.running .chip')).toHaveText('Thesis')
    await expect(app.locator('.running').getByRole('button', { name: 'Thesis' })).toHaveCount(0)
    await expect(app.getByRole('button', { name: 'Add a tag' })).toHaveCount(0)
  })

  test('giving up withers the tree', async ({ app }) => {
    await app.getByRole('button', { name: 'Plant' }).click()
    await app.getByRole('button', { name: 'Give up' }).click()
    await app.getByRole('dialog', { name: 'Give up on this tree?' }).getByRole('button', { name: 'Give up' }).click()
    await expect(app.getByRole('heading', { name: 'Your tree withered' })).toBeVisible()
    await app.getByRole('button', { name: 'Try again' }).click()
    await tab(app, 'Forest')
    await expect(app.locator('.forest-summary')).toContainText('1 withered')
  })
})
