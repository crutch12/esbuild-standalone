import { logger } from './logger.js'

export async function generateHash(text) {
  const buffer = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(typeof text === 'string' ? text : JSON.stringify(text)),
    ),
  );
  const hash = Array.from(buffer).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hash
}

export async function generateHashKey(...texts) {
  const items = texts.filter(v => v != null)
  if (items.length === 0) {
    throw new Error('texts param requires at least one element')
  }
  return generateHash(items.map((text => typeof text === 'string' ? text : JSON.stringify(text))).join(''))
}

export function getBuildParams(scriptElement, searchParams, globalConfig) {
  const { config, tsconfig } = extractParams(scriptElement, searchParams, globalConfig)

  const buildParams = {}

  /**
   * @example
   * '/esbuild.config.json'
   */
  const configUrl = config ? new URL(config, document.baseURI) : undefined

  if (configUrl) {
    buildParams.config = configUrl.origin === location.origin ? configUrl.pathname : configUrl.href
  }

  /**
   * @example
   * '/tsconfig.json'
   */
  const tsconfigUrl = tsconfig ? new URL(tsconfig, document.baseURI) : undefined

  if (tsconfigUrl) {
    buildParams.tsconfig = tsconfigUrl.origin === location.origin ? tsconfigUrl.pathname : tsconfigUrl.href
  }

  return buildParams
}

export async function fetchBuildConfigs(buildParams) {
  const { config, tsconfig } = buildParams || {}

  const [loadedConfig, loadedTsconfig] = await Promise.all([
    config ? fetch(config).then(r => r.json()).catch(logger.error) : undefined,
    // tsconfig allows invalid json, so it's text
    tsconfig ? fetch(tsconfig).then(r => r.text()).catch(logger.error) : undefined,
  ])

  return {
    config: loadedConfig,
    tsconfig: loadedTsconfig,
  }
}

const kebabize = (str) => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase())

export function extractParams(scriptElement, searchParams, globalConfig) {
  const knownParams = ['swUrl', 'swEsmUrl', 'swType', 'swScope', 'swUpdateViaCache', 'noReload', 'config', 'tsconfig']

  const params = {}

  function setParam(key, getter) {
    const values = [getter(key), getter(kebabize(key))]
    for (const value of values) {
      if (typeof value !== 'undefined') {
        params[key] = value
        return
      }
    }
  }

  knownParams.forEach((key) => {
    if (globalConfig) {
      setParam(key, key => globalConfig.hasOwnProperty(key) ? globalConfig[key] : undefined)
    }

    if (searchParams) {
      setParam(key, key => searchParams.has(key) ? searchParams.get(key) : undefined)
    }

    if (scriptElement) {
      setParam(key, key => scriptElement.dataset.hasOwnProperty(key) ? scriptElement.dataset[key] : undefined)
    }
  })

  return params
}