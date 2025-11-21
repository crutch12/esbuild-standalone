import { test as baseTest } from '@playwright/test';
import { PlaywrightWorkerOptions } from 'playwright/test';

// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// import path from 'path';

const testStatic = baseTest.extend({
  // doesn't work with Service Worker (idk)
  // context: async ({ context }, run) => {
  //   const __filename = fileURLToPath(import.meta.url);
  //   const __dirname = dirname(__filename);

  //   await context.route('http://localhost:3333/**/*', (route, request) => {
  //     return route.fulfill({ path: path.join(__dirname, '..', new URL(request.url()).pathname) })
  //   });
  //   await run(context);
  // },
});

function skipServiceWorkerTest(browserName: PlaywrightWorkerOptions['browserName']) {
  testStatic.skip(browserName === 'firefox', `firefox doesn't work with Service Workers + Playwright`);
}

function skipExternalModuleServiceWorkerTest(browserName: PlaywrightWorkerOptions['browserName']) {
  skipServiceWorkerTest(browserName)
  testStatic.skip(browserName === 'webkit', `webkit (Safari) doesn't work with module Service Workers + Playwright + Another domain import`);
}

export { testStatic, skipServiceWorkerTest, skipExternalModuleServiceWorkerTest }