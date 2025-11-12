import { logger } from './logger.js'
import { loadScripts } from './loadScripts.js'

function getSwParams() {
  const defaultParams = {
    swPath: '/service-worker.js',
    scope: "/",
    updateViaCache: "imports",
    type: 'module',
  }
  if (typeof window !== 'undefined') {
    return {
      ...defaultParams,
      ...window['ESBUILD_SW_PARAMS']
    }
  }
  return defaultParams
}

function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length === 0) {
        const { swPath, ...swParams } = getSwParams()
        navigator.serviceWorker
          // @TODO: pass params
          .register(swPath, swParams)
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
