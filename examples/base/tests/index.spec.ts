import { expect } from '@playwright/test';
import { testStatic, skipServiceWorkerTest, skipExternalModuleServiceWorkerTest } from '../../../e2e/utils.ts';

const loadingText = 'Loading...'
const helloText = 'Hello, esbuild-standalone'

testStatic('test sw (auto mode)', async ({ page, browserName }) => {
  skipServiceWorkerTest(browserName)

  await page.goto(`/examples/base/index.html`);
  await expect(page.getByText(loadingText)).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(page.getByText(helloText)).toBeVisible();
});

testStatic('test sw (module mode)', async ({ page, browserName }) => {
  skipExternalModuleServiceWorkerTest(browserName)

  page.addInitScript(() => {
    window.esbuildStandaloneOptions = {
      swType: 'module'
    }
  })

  await page.goto(`/examples/base/index.html`, { waitUntil: 'commit' });
  await expect(page.getByText(loadingText)).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(page.getByText(helloText)).toBeVisible();
});

testStatic('test sw (classic mode)', async ({ page, browserName }) => {
  skipServiceWorkerTest(browserName)

  await page.goto(`/examples/base/index.html`, { waitUntil: 'commit' });
  page.addInitScript(() => {
    window.esbuildStandaloneOptions = {
      swType: 'classic'
    }
  })

  await expect(page.getByText(loadingText)).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(page.getByText(helloText)).toBeVisible();
});
