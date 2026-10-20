import { readFile } from 'node:fs/promises'
import { expectCoins, expect, logSession, tab, test } from './fixtures'

test.describe('your data', () => {
  test('everything survives closing and reopening the app', async ({ app }) => {
    await logSession(app, { date: '2026-10-20', time: '09:00', quick: '1h' })
    await tab(app, 'Settings')
    await app.getByRole('tab', { name: 'Strict' }).click()
    // The selection only shows once it's been written to storage.
    await expect(app.getByRole('tab', { name: 'Strict' })).toHaveAttribute('aria-selected', 'true')
    await app.reload()
    await expectCoins(app, 60)
    await tab(app, 'Settings')
    await expect(app.getByRole('tab', { name: 'Strict' })).toHaveAttribute('aria-selected', 'true')
  })

  test('export → erase everything → restore brings it all back', async ({ app }) => {
    // Force the download path (desktop browsers may offer a share sheet instead).
    await app.evaluate(() => Object.defineProperty(navigator, 'canShare', { value: undefined }))
    await logSession(app, { date: '2026-10-20', time: '09:00', quick: '1h' })
    await logSession(app, { date: '2026-10-19', time: '09:00', quick: '2h' })

    await tab(app, 'Settings')
    const [download] = await Promise.all([app.waitForEvent('download'), app.getByRole('button', { name: 'Export backup' }).click()])
    expect(download.suggestedFilename()).toBe('lesisko-2026-10-20.json')
    const file = await download.path()
    const backup = JSON.parse(await readFile(file, 'utf8'))
    expect(backup.sessions).toHaveLength(2)
    await expect(app.getByText(/Last backup: 20 Oct 2026/)).toBeVisible()

    await app.getByRole('button', { name: 'Erase all data…' }).click()
    await app.getByRole('button', { name: 'Erase everything' }).click()
    await expect(app.locator('.tab-bar')).toBeVisible()
    await expectCoins(app, 0)

    await tab(app, 'Settings')
    await app.locator('input[type=file][accept*=json]').setInputFiles(file)
    const sheet = app.getByRole('dialog', { name: 'Restore backup?' })
    await expect(sheet).toContainText('with 2 sessions and 0 tags')
    await sheet.getByRole('button', { name: 'Restore' }).click()
    await expect(app.getByText('Restored 2 sessions.')).toBeVisible()
    await expectCoins(app, 180)
  })

  test('on iPhone, export goes through the share sheet as a file', async ({ app }) => {
    await app.evaluate(() => {
      const shared: { name: string; size: number }[] = []
      Object.assign(window, { shared })
      Object.defineProperty(navigator, 'canShare', { value: () => true })
      Object.defineProperty(navigator, 'share', {
        value: async ({ files }: { files: File[] }) => { shared.push(...files.map((f) => ({ name: f.name, size: f.size }))) },
      })
    })
    await tab(app, 'Settings')
    await app.getByRole('button', { name: 'Export backup' }).click()
    await expect.poll(() => app.evaluate(() => (window as unknown as { shared: { name: string }[] }).shared.map((f) => f.name)))
      .toEqual(['lesisko-2026-10-20.json'])
  })

  test('a non-backup file is refused politely', async ({ app }) => {
    await tab(app, 'Settings')
    await app.locator('input[type=file][accept*=json]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') })
    await expect(app.getByText('This doesn’t look like a Lesisko backup.')).toBeVisible()
  })

  test('Forest CSV import previews, imports, and never duplicates', async ({ app }) => {
    const csv = new URL('./files/forest-export.csv', import.meta.url).pathname
    await tab(app, 'Settings')
    const input = app.locator('input[type=file][accept*=csv]')
    await input.setInputFiles(csv)
    const preview = app.getByRole('dialog', { name: 'Import from Forest' })
    await expect(preview).toContainText('Found 3 sessions from 12 Oct 2026 to 14 Oct 2026: 2 trees, 1 withered, 1h 25m of focus.')
    await expect(preview).toContainText('1 row skipped:')
    await expect(preview).toContainText('Line 5: Unreadable date “not a date”')
    await preview.getByRole('button', { name: 'Import 3 sessions' }).click()
    await expect(app.getByRole('dialog', { name: 'Import finished 🌳' })).toContainText('Added 3 sessions.')
    await app.getByRole('button', { name: 'Nice' }).click()

    await input.setInputFiles(csv)
    await app.getByRole('button', { name: 'Import 3 sessions' }).click()
    await expect(app.getByRole('dialog', { name: 'Import finished 🌳' })).toContainText('Added 0 sessions and updated 3 already imported.')
    await app.getByRole('button', { name: 'Nice' }).click()

    await tab(app, 'Stats')
    await app.getByRole('button', { name: 'Previous' }).click()
    await expect(app.locator('.hero-number')).toHaveText('1h 25m')
    await expect(app.locator('.tag-bars')).toContainText('Math')
    await expect(app.locator('.tag-bars')).toContainText('Coding')
  })
})

test('works offline once it has been opened', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright’s WebKit build doesn’t run service workers')
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.tab-bar')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Plant' })).toBeVisible()
})
