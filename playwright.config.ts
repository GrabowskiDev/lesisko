import { defineConfig, devices } from '@playwright/test'

// End-to-end tests drive the production build in Safari's engine (WebKit) and Chrome,
// both emulating an iPhone. Run with `npm run test:e2e` (first time: `npx playwright install webkit`).
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'en-GB',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'iphone-safari', use: { ...devices['iPhone 15'] } },
    { name: 'iphone-chrome', use: { ...devices['iPhone 15'], browserName: 'chromium', channel: 'chrome' } },
  ],
})
