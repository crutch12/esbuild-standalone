import fs from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'
import { invariant } from './invariant.js'
import { SERVICE_WORKER_SOURCE_PATH } from './constants.js'

export async function init(args) {
  const CWD = args.cwd || process.cwd()
  const publicDir = args._[1] ? normalizePath(args._[1]) : '.'

  await copyWorkerScript(publicDir, CWD)
  const absolutePublicDir = path.resolve(CWD, publicDir)
  printSuccessMessage([absolutePublicDir])

  return
}

/**
 * @param {string} maybeAbsolutePath
 * @param {string} cwd
 * @returns {string}
 */
function toAbsolutePath(maybeAbsolutePath, cwd) {
  return path.isAbsolute(maybeAbsolutePath)
    ? maybeAbsolutePath
    : path.resolve(cwd, maybeAbsolutePath)
}

/**
 * @param {string} destination
 * @param {string} cwd
 * @returns {Promise<string>}
 */
async function copyWorkerScript(destination, cwd) {
  // When running as a part of "postinstall" script, "cwd" equals the library's directory.
  // The "postinstall" script resolves the right absolute public directory path.
  const absolutePublicDir = toAbsolutePath(destination, cwd)

  if (!fs.existsSync(absolutePublicDir)) {
    await fs.promises
      .mkdir(absolutePublicDir, { recursive: true })
      .catch((error) => {
        throw new Error(
          invariant(
            false,
            'Failed to copy the worker script at "%s": directory does not exist and could not be created.\nMake sure to include a relative path to the public directory of your application.\n\nSee the original error below:\n\n%s',
            absolutePublicDir,
            error,
          ),
        )
      })
  }

  // eslint-disable-next-line no-console
  console.log('Copying the worker script at "%s"...', absolutePublicDir)

  const workerFilename = path.basename(SERVICE_WORKER_SOURCE_PATH)
  const workerDestinationPath = path.resolve(absolutePublicDir, workerFilename)

  fs.copyFileSync(SERVICE_WORKER_SOURCE_PATH, workerDestinationPath)

  return workerDestinationPath
}

/**
 * @param {Array<string>} paths
 */
function printSuccessMessage(paths) {
  // eslint-disable-next-line no-console
  console.log(`
${colors.green('Worker script successfully copied!')}
${paths.map((path) => colors.gray(`  - ${path}\n`))}
Continue by describing the network in your application:


${colors.red(colors.bold('https://www.npmjs.com/package/esbuild-standalone'))}
`)
}

function printFailureMessage(pathsWithErrors) {
  // eslint-disable-next-line no-console
  console.error(`\
${colors.red('Copying the worker script failed at following paths:')}
${pathsWithErrors
      .map(([path, error]) => colors.gray(`  - ${path}`) + '\n' + `  ${error}`)
      .join('\n\n')}
  `)
}

/**
 * Normalizes the given path, replacing ambiguous path separators
 * with the platform-specific path separator.
 * @param {string} input Path to normalize.
 * @returns {string}
 */
function normalizePath(input) {
  return input.replace(/[\\|\/]+/g, path.sep)
}