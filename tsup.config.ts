import { defineConfig } from 'tsup'
import { umdWrapper } from 'esbuild-plugin-umd-wrapper';

export default defineConfig([
  // @NOTE: generate UMD bundle for Service Worker (Firefox doesn't support esm in SW)
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1360870
  {
    entry: {
      'sdk.umd': './lib/sdk/index.js'
    },
    outDir: './umd',
    target: 'es2022',
    sourcemap: true,
    esbuildPlugins: [
      umdWrapper({
        libraryName: 'esbuildStandalone',
      }),
    ],
    format: 'umd' as 'iife',
  }
])