import esbuild from 'https://esm.sh/esbuild-wasm@0.27.0';
import { logger } from './sdk/logger.js'
import { loadScripts } from './sdk/loadScripts.js'
import { getBuildParams } from './sdk/utils.js'

function getSwParams(buildParams) {
  const searchParams = new URL(import.meta.url).searchParams

  const url = searchParams.get('url') || '/service-worker.js'
  const swUrl = new URL(url, document.baseURI)
  const scope = searchParams.get('scope') || swUrl.pathname.replace(/\/[^/]*$/, '/') // /sw.js -> /
  const updateViaCache = searchParams.get('updateViaCache') || 'imports'
  const type = searchParams.get('type') || 'classic' // @NOTE: firefox doesn't properly support 'module' type

  const { config, tsconfig } = buildParams || {}

  if (config) {
    swUrl.searchParams.append('config', config)
  }

  if (tsconfig) {
    swUrl.searchParams.append('tsconfig', tsconfig)
  }

  const params = {
    url: swUrl.href,
    scope,
    updateViaCache,
    type,
  }

  return {
    ...params,
    ...window['ESBUILD_STANDALONE_SW_PARAMS']
  }
}

function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && "serviceWorker" in navigator) {
    const controller = navigator.serviceWorker.controller
    const ready = controller && controller.state === 'activated'

    const searchParams = new URL(import.meta.url).searchParams
    const buildParams = getBuildParams(searchParams)

    if (ready) {
      loadScripts(esbuild, { buildParams, recursive: false, processExternal: false })
    }

    navigator.serviceWorker.getRegistrations().then(registrations => {
      const { url, ...params } = getSwParams(buildParams)
      navigator.serviceWorker
        .register(url, params)
        .then((registration) => {
          if (!ready) {
            window.location.reload() // force reload page, otherwise Service Worker doesn't work
          }
        })
        .catch((error) => {
          logger.error(error)
        });
    });
  }
  else {
    logger.error('navigator.serviceWorker is not available')
  }
}

function onDOMContentLoaded() {
  registerServiceWorker()
}

if (typeof document !== 'undefined') {
  if (document.readyState && document.readyState === "complete" || document.readyState === "interactive") {
    onDOMContentLoaded()
  }
  else {
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("DOMContentLoaded", onDOMContentLoaded, false);
    }
    else {
      logger.error('window.addEventListener is not available')
    }
  }
}
else {
  logger.error('document is not available')
}
