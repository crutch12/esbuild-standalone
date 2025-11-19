import esbuild from 'https://esm.sh/esbuild-wasm@0.27.0';
import { logger } from './sdk/logger.js'
import { loadScripts } from './sdk/loadScripts.js'
import { getBuildParams } from './sdk/utils.js'
import { pluginName, version } from './sdk/meta.js'

const forceReloadKey = `${pluginName}@${version}/force-reload`

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

function isControllerReady() {
  const controller = navigator.serviceWorker.controller
  return controller && controller.state === 'activated'
}

function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && "serviceWorker" in navigator) {
    const ready = isControllerReady()

    const searchParams = new URL(import.meta.url).searchParams
    const buildParams = getBuildParams(searchParams)
    const { url, ...params } = getSwParams(buildParams)

    const runLoadScripts = () => loadScripts(esbuild, { buildParams, recursive: false, processExternal: false })

    if (ready) { // @TODO: compary navigator.serviceWorker.ready with params.scope
      localStorage.removeItem(forceReloadKey)
      runLoadScripts()
    }

    navigator.serviceWorker
      .register(url, params)
      .then(async () => {
        await navigator.serviceWorker.ready // in case of self.clients.claim() usage
        const yetReady = isControllerReady()
        if (!yetReady) {
          logger.warn('navigator.serviceWorker.controller is not ready, should force reload the page')
          const forceReload = localStorage.getItem(forceReloadKey)
          if (forceReload) {
            // prevent infinite force reloading
            logger.error(`force reload at ${forceReload} couldn't initialize navigator.serviceWorker.controller, looks like service-worker.js is broken.\nThings will go wrong!!!`)
          }
          else {
            localStorage.setItem(forceReloadKey, new Date().toISOString())
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
