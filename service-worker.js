(() => {
  globalThis['ESBUILD_STANDALONE_IS_DEV'] = false // true for local library usage
  const esbuildStandaloneImportBasePath = globalThis['ESBUILD_STANDALONE_IS_DEV'] ? '' : 'https://unpkg.com/esbuild-standalone@0.0.16'
  importScripts(`${esbuildStandaloneImportBasePath}/lib/sw-tools/index.js`)
})()
