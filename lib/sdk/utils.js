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