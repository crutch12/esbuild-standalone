import { logger } from './logger.js'
import { loadScripts } from './loadScripts.js'

function getSwParams() {
  const searchParams = new URL(import.meta.url).searchParams

  const url = searchParams.get('url') || '/service-worker.js'
  const scope = searchParams.get('scope') || url.replace(/\/[^/]*$/, '/') // /sw.js -> /
  const updateViaCache = searchParams.get('updateViaCache') || 'imports'
  const type = searchParams.get('type') || 'module'

  const params = {
    url,
    scope,
    updateViaCache,
    type,
  }

  if (typeof window !== 'undefined') {
    return {
      ...params,
      ...window['ESBUILD_STANDALONE_SW_PARAMS']
    }
  }

  return params
}

function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length === 0) {
        const { url, ...params } = getSwParams()
        navigator.serviceWorker
          .register(url, params)
          .then((registration) => {
            location.reload() // reload page on first registration (@TODO: doesn't work properly)
          })
          .catch((error) => {
            logger.error(error)
          });
      }
      else {
        loadScripts()
      }
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
