import { expect } from '@playwright/test';
import { testStatic, skipServiceWorkerTest } from '../../../e2e/utils.ts';

const helloText = 'Hello, external script App (SW required)'

testStatic('test sw', async ({ page, browserName, context }) => {
  skipServiceWorkerTest(browserName)
  await page.goto(`/examples/react/index.html`);
  await page.waitForTimeout(5000);
  await expect(page.getByText(helloText)).toBeVisible();
});

testStatic('test sw (module mode)', async ({ page, browserName }) => {
  skipServiceWorkerTest(browserName)

  page.addInitScript(() => {
    window.esbuildStandaloneOptions = {
      swType: 'module'
    }
  })

  await page.goto(`/examples/react/index.html`, { waitUntil: 'commit' });
  await page.waitForTimeout(5000);
  await expect(page.getByText(helloText)).toBeVisible();
});