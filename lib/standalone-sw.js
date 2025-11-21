import esbuild from 'https://esm.sh/esbuild-wasm@0.27.0';
import { logger } from './sdk/logger.js'
import { loadScripts } from './sdk/loadScripts.js'
import { getBuildParams, extractParams } from './sdk/utils.js'
import { localStorageKeys, postMessageTypes } from './sdk/constants.js'

function swImportsAllowed() {
  const u = navigator.userAgent, v = s => +((u.match(s) || [])[1] || 0);
  if (/SamsungBrowser/.test(u)) return false;
  if (/Firefox/.test(u)) return v(/Firefox\/(\d+)/) >= 147;
  if (/OPR/.test(u)) return v(/OPR\/(\d+)/) >= 77;
  if (/Edg\//.test(u)) return v(/Edg\/(\d+)/) >= 91;
  if (/Chrome\//.test(u) && !u.includes("Edg/")) return v(/Chrome\/(\d+)/) >= 91;
  if (/Safari\/.+Version\//.test(u) && !u.includes("Chrome")) return v(/Version\/(\d+)/) >= 16;
  return false;
}

function getSwParams(scriptElement, searchParams, globalConfig) {
  const {
    swUrl,
    swEsmUrl,
    swType,
    swScope,
    swUpdateViaCache,
  } = extractParams(scriptElement, searchParams, globalConfig)

  const defaultUrl = '/service-worker.js'
  const defaultEsmUrl = '/service-worker.mjs'

  const defaultType = swImportsAllowed() ? 'module' : 'classic'
  const type = swType || defaultType // @NOTE: firefox doesn't properly support 'module' type

  const url = type === 'module' ? (swEsmUrl || swUrl || defaultEsmUrl || defaultUrl) : (swUrl || defaultUrl)
  const fullUrl = new URL(url, document.baseURI)
  const scope = swScope || fullUrl.pathname.replace(/\/[^/]*$/, '/') // /sw.js -> /
  const updateViaCache = swUpdateViaCache || 'imports'

  const params = {
    url: fullUrl.href,
    scope,
    updateViaCache,
    type,
  }

  return params
}

function isControllerReady() {
  const controller = navigator.serviceWorker.controller
  return controller && controller.state === 'activated'
}

function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && "serviceWorker" in navigator) {
    const ready = isControllerReady()

    const scriptElement = document.getElementById('esbuild-standalone')
    const searchParams = new URL(import.meta.url).searchParams
    const globalConfig = globalThis['esbuildStandaloneOptions']
    const buildParams = getBuildParams(scriptElement, searchParams, globalConfig)
    const { url, ...params } = getSwParams(scriptElement, searchParams, globalConfig)
    const { noReload } = extractParams(scriptElement, searchParams, globalConfig)

    const runLoadScripts = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: postMessageTypes.buildParams, payload: buildParams });
      }
      loadScripts(esbuild, { buildParams, recursive: false, processExternal: false })
    }

    if (ready) { // @TODO: compary navigator.serviceWorker.ready with params.scope
      localStorage.removeItem(localStorageKeys.forceReload)
      runLoadScripts()
    }

    navigator.serviceWorker
      .register(url, params)
      .then(async () => {
        await navigator.serviceWorker.ready // in case of self.clients.claim() usage
        const yetReady = isControllerReady()
        if (!yetReady) {
          logger.warn('navigator.serviceWorker.controller is not ready, should force reload the page')
          const forceReload = localStorage.getItem(localStorageKeys.forceReload)
          if (forceReload) {
            // prevent infinite force reloading
            logger.error(`force reload at ${forceReload} couldn't initialize navigator.serviceWorker.controller, looks like service-worker.js is broken.\nThings will go wrong!!!`)
          }
          else {
            if (noReload) {
              logger.warn('noReload param was passed, skipping reload. you have to update current page manually')
              return;
            }
            localStorage.setItem(localStorageKeys.forceReload, new Date().toISOString())
            return window.location.reload() // force reload page, otherwise Service Worker doesn't work
          }
        }
        if (!ready) {
          runLoadScripts()
        }
      })
      .catch((error) => {
        logger.error(error)
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
