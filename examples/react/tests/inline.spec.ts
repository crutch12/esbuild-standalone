import { expect } from '@playwright/test';
import { testStatic } from '../../../e2e/utils.ts';

const loadingText = 'Loading...'
const helloText = 'Hello, inline script App with no import usage (no SW required)'

testStatic('test inline (no-sw)', async ({ page }) => {
  await page.goto(`/examples/react/inline.html`);
  await page.waitForTimeout(5000);
  await expect(page.getByText(helloText)).toBeVisible();
});