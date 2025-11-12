#!/usr/bin/env node
import yargs from 'yargs'
import { init } from './init.js'

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
yargs(process.argv.slice(2))
  .usage('$0 <cmd> [args]')
  .command(
    'init',
    'Initializes Service Worker at the specified directory',
    (yargs) => {
      yargs
        .positional('publicDir', {
          type: 'string',
          description: 'Relative path to the public directory',
          demandOption: false,
          normalize: true,
        })
        .option('cwd', {
          type: 'string',
          description: 'Custom current worker directory',
          normalize: true,
        })
        .example('npx esbuild-standalone init')
        .example('npx esbuild-standalone init ./public')
    },
    init,
  )
  .demandCommand()
  .help().argv