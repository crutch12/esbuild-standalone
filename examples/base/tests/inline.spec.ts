import { expect } from '@playwright/test';
import { testStatic } from '../../../e2e/utils.ts';

const loadingText = 'Loading...'
const helloText = 'Hello, esbuild-standalone'

testStatic('test inline (no-sw)', async ({ page }) => {
  await page.goto(`/examples/base/inline.html`);
  await expect(page.getByText(loadingText)).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(page.getByText(helloText)).toBeVisible();
});