import esbuild from 'https://esm.sh/esbuild-wasm@0.27.0/lib/browser'

import * as esbuildStandalone from '../sdk/index.js'

import { initialize } from './initialize.mjs'

initialize(esbuild, esbuildStandalone)