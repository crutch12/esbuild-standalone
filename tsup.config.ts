import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'sdk': './lib/sdk/index.js'
    // 'foo': './lib/sdk/index.js'
  },
  outDir: './umd',
  target: 'es2024',
  sourcemap: true,
  format: 'iife',
  // globalName: 'esbuildStandalone'
})