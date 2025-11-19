import esbuild from 'https://esm.sh/esbuild-wasm@0.27.0';
import { logger } from './sdk/logger.js'
import { loadScripts } from './sdk/loadScripts.js'
import { getBuildParams } from './sdk/utils.js'

function onDOMContentLoaded() {
  const searchParams = new URL(import.meta.url).searchParams
  const buildParams = getBuildParams(searchParams)
  loadScripts(esbuild, { buildParams, recursive: true, processExternal: true })
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
