import { defineConfig } from 'tsup'
import { umdWrapper } from 'esbuild-plugin-umd-wrapper';

export default defineConfig({
  entry: {
    'sdk.umd': './lib/sdk/index.js'
    // 'foo': './lib/sdk/index.js'
  },
  outDir: './umd',
  target: 'es2024',
  sourcemap: true,
  external: [/https:\/\/esm.sh\/esbuild-wasm@0.27.0/],
  // define: {
  //   'https://esm.sh/esbuild-wasm@0.27.0'
  // },
  // external
  format: 'umd',
  // esbuildOptions: {

  // },
  esbuildPlugins: [
    umdWrapper({
      libraryName: 'esbuildStandalone',
    }),
  ],
  // plugins: [

  // ],
  // globalName: 'esbuildStandalone'
})