import { defineConfig } from '@playwright/test';

// Drives the real game in Chromium through the dev server. WebGL runs on
// SwiftShader so it works on CI machines without a GPU.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5174',
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
      // Lets a machine with a pre-installed Chromium skip the download.
      executablePath: process.env.CHROMIUM_PATH || undefined,
    },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
  },
});
