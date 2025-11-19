import { logger } from './logger.js';
import { build } from './build.js';
import { pluginName, version } from './meta.js';
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

export function loadScripts(esbuild, options) {
  const scripts = document.querySelectorAll('script[type="text/esbuild"], script[type="text/babel"], script[type="text/jsx"], script[type="text/tsx"], script[type="text/ts"], script[type="text/vue"]')

  const { buildParams, recursive = false, processExternal = false } = options || {}

  const buildConfigsFetcher = createBuildConfigsFetcher(buildParams)

  scripts.forEach(async (script, idx) => {
    if (script.src && !processExternal) {
      import(script.src) // import via service worker
        .catch(err => {
          logger.error('Error loading script from:', script.src, err); // @TODO: doesn't work. Should we use window.onerror?
        })
      return
    }

    if (script.src && processExternal || script.innerHTML && script.innerHTML.trim()) {
      const moduleScript = document.createElement('script');

      moduleScript.type = 'module';

      const [{ config, tsconfig }, content] = await Promise.all([
        buildConfigsFetcher(),
        script.src ? fetch(script.src).then(r => r.text()) : script.innerHTML
      ])

      const cacheKey = [
        pluginName,
        await generateHashKey(content, tsconfig, config),
      ].join('/')

      const cachedResult = localStorage.getItem(cacheKey)

      const result = cachedResult || await (async () => {
        const esbuildOptions = {
          ...config,
          ...(tsconfig ? { tsconfigRaw: tsconfig } : undefined),
        }

        const pathname = script.src ? new URL(script.src, document.baseURI).pathname : new URL(`./${idx}.tsx`, document.baseURI).pathname

        const { output, cacheable } = await build(
          esbuild,
          {
            [pathname]: {
              contents: content,
              loader: 'tsx', // @TODO
            }
          },
          {
            esbuildOptions,
            baseURI: document.baseURI,
            recursive,
          }
        )

        if (cacheable) {
          localStorage.setItem(cacheKey, output)
        }

        return output
      })()


      moduleScript.textContent = result

      moduleScript.onerror = (err) => {
        console.error('Error loading script from:', moduleScript, err); // @TODO: doesn't work. Should we use window.onerror?
      };

      script.after(moduleScript) // @TODO: el.replaceWith(script);

      return;
    }

    logger.warn('no src or innerHTML provided for script:', script)
  })
}