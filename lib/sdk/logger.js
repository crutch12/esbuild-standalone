
const pluginName = 'esbuild-standalone'

export const logger = {
  error(...params) {
    console.error(`[${pluginName}]`, ...params)
  },

  warn(...params) {
    console.warn(`[${pluginName}]`, ...params)
  }
}