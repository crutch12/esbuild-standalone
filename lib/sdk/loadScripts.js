import esbuild from 'https://esm.sh/esbuild-wasm@0.25.11';
import { logger } from './logger.js';
import { build } from './build.js';
import { generateHash } from './utils.js';

export function loadScripts() {
  const scripts = document.querySelectorAll('script[type="text/esbuild"], script[type="text/babel"], script[type="text/jsx"], script[type="text/tsx"], script[type="text/ts"], script[type="text/vue"]')

  scripts.forEach(async (script) => {
    if (script.src) {
      import(script.src) // import via service worker
        .catch(err => {
          logger.error('Error loading script from:', script.src, err); // @TODO: doesn't work. Should we use window.onerror?
        })

      return
    }

    if (script.innerHTML) {

      // const { build } = await import('./build.js') // @TODO: should we use async import instead?

      const moduleScript = document.createElement('script');

      moduleScript.type = 'module';

      const cacheKey = await generateHash(script.innerHTML)

      const cachedResult = localStorage.getItem(cacheKey)

      const result = cachedResult || await build(
        esbuild,
        {
          ['index.tsx']: {
            contents: script.innerHTML,
            loader: 'tsx', // @TODO
          }
        }
      )

      localStorage.setItem(cacheKey, result)

      moduleScript.textContent = result

      moduleScript.onerror = (err) => {
        console.error('Error loading script from:', moduleScript, err); // @TODO: doesn't work. Should we use window.onerror?
      };

      script.after(moduleScript)

      return;
    }

    logger.warn('no src or innerHTML provided for script:', script)
  })
}