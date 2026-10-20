import { expectCoins, expect, logSession, tab, test } from './fixtures'

test.describe('logging and editing sessions', () => {
  test('forgotten time counts in today, the forest, stats and coins', async ({ app }) => {
    await logSession(app, { date: '2026-10-20', time: '09:00', quick: '1h' })
    await logSession(app, { date: '2026-10-19', time: '18:00', quick: '1h 30m' })
    await expect(app.locator('.today-total')).toHaveText('1h')
    await expectCoins(app, 150)

    await tab(app, 'Forest')
    await expect(app.locator('.session-row')).toHaveCount(1)
    await expect(app.locator('.session-row')).toContainText('09:00 – 10:00')
    await expect(app.locator('.session-row')).toContainText('logged')

    await tab(app, 'Stats')
    await expect(app.locator('.hero-number')).toHaveText('2h 30m') // this week
    await app.getByRole('tab', { name: 'Day' }).click()
    await expect(app.locator('.hero-number')).toHaveText('1h')
    await app.getByRole('button', { name: 'Previous' }).click()
    await expect(app.locator('.period-label')).toHaveText('Yesterday')
    await expect(app.locator('.hero-number')).toHaveText('1h 30m')
  })

  test('sessions in the future are rejected', async ({ app }) => {
    await app.getByRole('button', { name: 'Log time I forgot to track' }).click()
    const sheet = app.getByRole('dialog', { name: 'Log focus time' })
    await sheet.getByLabel('Started at').fill('13:30')
    await expect(sheet.getByText('This session would end in the future.')).toBeVisible()
    await expect(sheet.getByRole('button', { name: 'Add 1h' })).toBeDisabled()
  })

  test('overlapping sessions get a warning', async ({ app }) => {
    await logSession(app, { date: '2026-10-20', time: '09:00', quick: '1h' })
    await app.getByRole('button', { name: 'Log time I forgot to track' }).click()
    const sheet = app.getByRole('dialog', { name: 'Log focus time' })
    await sheet.getByLabel('Started at').fill('09:30')
    await expect(sheet.getByText(/overlaps another session \(09:00–10:00\)/)).toBeVisible()
  })

  test('a session can be edited, marked withered and deleted', async ({ app }) => {
    await logSession(app, { date: '2026-10-20', time: '09:00', quick: '1h' })
    await tab(app, 'Forest')
    await app.locator('.session-row').click()
    const edit = app.getByRole('dialog', { name: 'Edit session' })
    await edit.getByRole('button', { name: '45m', exact: true }).click()
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(app.locator('.session-row')).toContainText('45m')
    await expectCoins(app, 45)

    await tab(app, 'Forest')
    await app.locator('.session-row').click()
    await edit.getByRole('switch', { name: 'Tree survived' }).click()
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(app.locator('.forest-summary')).toContainText('1 withered')
    await expectCoins(app, 0)

    await tab(app, 'Forest')
    await app.locator('.session-row').click()
    await edit.getByRole('button', { name: 'Delete session' }).click()
    await edit.getByRole('button', { name: 'Delete for good' }).click()
    await expect(app.locator('.session-row')).toHaveCount(0)
  })

  test('a new tag can be created while logging time, with Enter or the Add button', async ({ app }) => {
    // Used to submit the page (a <form> nested in the session form): it reloaded and saved nothing.
    await app.evaluate(() => Object.assign(window, { notReloaded: true }))
    await app.getByRole('button', { name: 'Log time I forgot to track' }).click()
    const sheet = app.getByRole('dialog', { name: 'Log focus time' })

    await sheet.getByRole('button', { name: 'New tag' }).click()
    await sheet.getByPlaceholder('Tag name').fill('Physics')
    await sheet.getByPlaceholder('Tag name').press('Enter')
    await expect(sheet.getByRole('button', { name: 'Physics' })).toHaveClass(/selected/)

    await sheet.getByRole('button', { name: 'New tag' }).click()
    await sheet.getByPlaceholder('Tag name').fill('Chemistry')
    await sheet.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(sheet.getByRole('button', { name: 'Chemistry' })).toHaveClass(/selected/)

    expect(await app.evaluate(() => (window as unknown as { notReloaded?: boolean }).notReloaded)).toBe(true)
    await sheet.getByRole('button', { name: 'Add 1h' }).click()
    await expect(sheet).toBeHidden()
    await tab(app, 'Stats')
    await expect(app.locator('.tag-bars')).toContainText('Chemistry')
    await expect(app.locator('.tag-bars li')).toHaveCount(1)
  })

  test('tags can be created, used, renamed and deleted', async ({ app }) => {
    await app.locator('.focus-controls').getByRole('button', { name: 'No tag' }).click()
    const sheet = app.getByRole('dialog', { name: 'What are you focusing on?' })
    await sheet.getByRole('button', { name: 'New tag' }).click()
    await sheet.getByPlaceholder('Tag name').fill('Math')
    await sheet.getByRole('button', { name: 'Add' }).click()
    await expect(app.locator('.focus-controls')).toContainText('Math')

    await logSession(app, { date: '2026-10-20', time: '09:00', quick: '1h' })
    await tab(app, 'Stats')
    await expect(app.locator('.tag-bars')).toContainText('Math')

    await tab(app, 'Settings')
    const name = app.getByLabel('Tag name')
    await name.fill('Calculus')
    await name.blur()
    await tab(app, 'Stats')
    await expect(app.locator('.tag-bars')).toContainText('Calculus')

    await tab(app, 'Settings')
    await app.getByRole('button', { name: 'Delete Calculus' }).click()
    await app.locator('.tag-row').getByRole('button', { name: 'Delete' }).click()
    await tab(app, 'Stats')
    await expect(app.locator('.tag-bars')).toContainText('No tag')
  })
})
