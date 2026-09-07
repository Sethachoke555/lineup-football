import { defineConfig } from '@playwright/test';
import base from '../playwright.config';

// Test the current production build rather than an already-running editor on port 3000.
export default defineConfig({
  ...base,
  testDir: './browser',
  testMatch: 'starting-lineup.spec.ts',
  use: { ...base.use, baseURL: 'http://127.0.0.1:3107' },
  webServer: { command: 'npm run start -- --hostname 127.0.0.1 --port 3107', url: 'http://127.0.0.1:3107', reuseExistingServer: false, timeout: 60000 },
});
