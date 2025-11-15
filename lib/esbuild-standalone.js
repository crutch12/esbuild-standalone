import { logger } from './sdk/logger.js'
import { loadScripts } from './sdk/loadScripts.js'

function onDOMContentLoaded() {
  loadScripts()
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
