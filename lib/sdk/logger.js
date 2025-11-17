import { version, pluginName } from './meta.js'

export const logger = {
  error(...params) {
    console.error(`[${pluginName}@${version}]`, ...params)
  },

  warn(...params) {
    console.warn(`[${pluginName}@${version}]`, ...params)
  }
}