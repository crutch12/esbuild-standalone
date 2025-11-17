import esbuild from 'https://esm.sh/esbuild-wasm@0.27.0';
import { logger } from './logger.js';
import { build } from './build.js';
import { generateHashKey, fetchBuildConfigs } from './utils.js';

function createBuildConfigsFetcher(buildParams) {
  let fetchBuildConfigsResult = undefined

  return () => {
    if (fetchBuildConfigsResult) {
      return fetchBuildConfigsResult
    }

    fetchBuildConfigsResult = fetchBuildConfigs(buildParams)

    return fetchBuildConfigsResult
  }
}

export function loadScripts(buildParams) {
  const scripts = document.querySelectorAll('script[type="text/esbuild"], script[type="text/babel"], script[type="text/jsx"], script[type="text/tsx"], script[type="text/ts"], script[type="text/vue"]')

  const buildConfigsFetcher = createBuildConfigsFetcher(buildParams)

  scripts.forEach(async (script) => {
    if (script.src) {
      import(script.src) // import via service worker
        .catch(err => {
          logger.error('Error loading script from:', script.src, err); // @TODO: doesn't work. Should we use window.onerror?
        })

      return
    }

    if (script.innerHTML && script.innerHTML.trim()) {

      // const { build } = await import('./build.js') // @TODO: should we use async import instead?

      const moduleScript = document.createElement('script');

      moduleScript.type = 'module';

      const { config, tsconfig } = await buildConfigsFetcher()
      const cacheKey = await generateHashKey(script.innerHTML, tsconfig, config)

      const cachedResult = localStorage.getItem(cacheKey)

      const result = cachedResult || await (async () => {
        const esbuildOptions = {
          ...config,
          ...(tsconfig ? { tsconfigRaw: tsconfig } : undefined),
        }

        return build(
          esbuild,
          {
            ['index.tsx']: {
              contents: script.innerHTML,
              loader: 'tsx', // @TODO
            }
          },
          esbuildOptions
        )
      })()

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