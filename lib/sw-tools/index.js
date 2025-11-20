(() => {
  // @NOTE: UMD "esbuild" import (firefox doesn't support 'module' type for SW)
  importScripts('https://unpkg.com/esbuild-wasm@0.27.0/lib/browser.js')

  const esbuildStandaloneImportBasePath = globalThis['ESBUILD_STANDALONE_IS_DEV'] ? '' : 'https://unpkg.com/esbuild-standalone@0.0.18'

  // @NOTE: UMD "esbuildStandalone" import (firefox doesn't support 'module' type for SW)
  importScripts(`${esbuildStandaloneImportBasePath}/umd/sdk.umd.js`)

  // @NOTE: UMD "esbuildStandaloneInitialize" import (firefox doesn't support 'module' type for SW)
  importScripts(`${esbuildStandaloneImportBasePath}/lib/sw-tools/initialize.js`)

  esbuildStandaloneInitialize.initialize(esbuild, esbuildStandalone)
})()
