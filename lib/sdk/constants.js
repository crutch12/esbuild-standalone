import { pluginName, version } from './meta.js'

const localStorageKeys = {
  forceReload: `${pluginName}/force-reload`,
}

const postMessageTypes = {
  buildParams: `${pluginName}/build-params`,
}

const globalThisKeys = {
  esbuildInitialized: `${pluginName}/esbuild-initialized`,
}

export { localStorageKeys, postMessageTypes, globalThisKeys }