import { version, pluginName } from './meta.js'

export const logger = {
  error(...params) {
    console.error(`[${pluginName}]`, ...params)
  },

  warn(...params) {
    console.warn(`[${pluginName}]`, ...params)
  }
}