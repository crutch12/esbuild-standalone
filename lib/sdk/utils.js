import { logger } from './logger.js'

export async function generateHash(text) {
  // Encode the string as a Uint8Array
  const msgBuffer = new TextEncoder().encode(text);

  // Hash the text using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // Convert the ArrayBuffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');

  return hashHex;
}

export async function generateHashKey(...texts) {
  const items = texts.filter(v => v != null).map(text => typeof text === 'string' ? text : JSON.stringify(text))
  if (items.length === 0) {
    throw new Error('texts param requires at least one element')
  }
  return Promise.all(items.map(generateHash)).then(texts => texts.join('.'))
}

export function getBuildParams(searchParams) {
  const buildParams = {}

  /**
   * @example
   * https://esm.sh/esbuild-standalone/sw?config=/esbuild.config.json
   */
  const config = searchParams.get('config')
  const configUrl = config ? new URL(config, document.baseURI) : undefined

  if (configUrl) {
    buildParams.config = configUrl.origin === location.origin ? configUrl.pathname : configUrl.href
  }

  /**
   * @example
   * https://esm.sh/esbuild-standalone/sw?tsconfig=/tsconfig.json
   */
  const tsconfig = searchParams.get('tsconfig')
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