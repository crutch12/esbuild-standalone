import { pluginName, version } from './meta.js'
import { globalThisKeys } from './constants.js'

function isRelativeUrl(url) {
  return ['/', './', '../'].some(prefix => url.startsWith(prefix))
}

function isSameOriginUrl(url, baseURI) {
  const fullUrl = new URL(url)
  const fullBaseURI = new URL(baseURI)
  return fullUrl.origin === fullBaseURI.origin
}

/**
 * Should process only relative and same-origin urls
 * @param {string} url 
 * @param {string} baseURI 
 * @returns 
 */
function shouldProcessImport(url, baseURI) {
  const matchExtension = Boolean(url.match(/\.(js|jsx|ts|tsx|vue|css|json)/))

  if (!matchExtension) return false;

  if (isRelativeUrl(url)) {
    return true
  }

  if (isSameOriginUrl(url, baseURI)) {
    return true
  }

  return false
}

// @TODO: handle importmap
// @TODO: support jsxImportSource (e.g. vue/preact/solid-js) with tsconfig.json
export async function build(esbuild, files, options) {
  const inWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope

  if (!globalThis[globalThisKeys.esbuildInitialized]) {
    globalThis[globalThisKeys.esbuildInitialized] = esbuild.initialize({
      worker: !inWorker,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.27.0/esbuild.wasm',
      // wasmURL: 'https://cdn.skypack.dev/esbuild-wasm@0.27.0/esbuild.wasm',
    })
  }

  await globalThis[globalThisKeys.esbuildInitialized];

  const { esbuildOptions, recursive = false, baseURI = undefined, replaceImportMeta = false, replaceDynamicImport = false } = options || {}

  let cacheable = true

  // comments at start of an output file
  const banner = [
    pluginName,
    `build-date:${new Date().toISOString()}`,
  ]

  const result = await esbuild.build({
    entryPoints: Object.keys(files),
    bundle: true,
    format: "esm",
    write: false,
    jsx: 'automatic',
    legalComments: 'inline', // used for replaceDynamicImport usage ¯\_(ツ)_/¯
    loader: {
      '.js': 'jsx', // Treat .js files as JSX
      '.jsx': 'jsx', // Treat .js files as JSX
      '.ts': 'ts',   // Treat .ts files as TypeScript
      '.tsx': 'tsx', // Treat .tsx files as TypeScript with JSX
      '.vue': 'tsx', // Treat .vue files as TypeScript with JSX
      '.css': 'css', // Treat .css files as CSS
      '.json': 'json', // Treat .json files as JSON
      // '.png': 'file', // Copy .png files as-is (e.g., to the output directory)
    },
    banner: {
      js: banner.map(str => `// ${str}`).join('\n'),
      css: banner.map(str => `/* ${str} */`).join('\n'),
    },
    plugins: [
      {
        name: "virtual-files",
        setup(build) {
          const entryPoints = build.initialOptions.entryPoints

          // First, a resolver to mark React as external and resolve @/ paths to "virtual" namespace
          build.onResolve({ filter: /.*/ }, (args) => {
            // Mark React as external (loaded via importmap)
            // if (/^(react|react-dom|react-dom\/client)$/.test(args.path)) {
            //   return { path: args.path, external: true };
            // }

            // Resolve all @/ paths to virtual namespace
            if (Object.keys(files).some(pathname => args.path.startsWith(pathname))) {
              return {
                path: args.path,
                namespace: "virtual",
              };
            }

            if (recursive && shouldProcessImport(args.path, baseURI)) {
              if (args.namespace === 'virtual') {
                if (['dynamic-import', 'import-statement'].includes(args.kind)) {
                  const importer = args.importer ? new URL(args.importer, baseURI) : undefined
                  const pathname = new URL(args.path, importer || baseURI).pathname

                  const resolvedPathFetchKey = [
                    pluginName,
                    'fetch',
                    pathname,
                  ].join(':')

                  // caching asset
                  globalThis[resolvedPathFetchKey] = globalThis[resolvedPathFetchKey] || fetch(pathname, {
                    headers: {
                      Accept: 'application/javascript, text/javascript, text/plain, text/jsx, text/babel, */*'
                    }
                  }).then((res) => res.text())

                  files[pathname] = globalThis[resolvedPathFetchKey].then((text) => {
                    return {
                      contents: text,
                      loader: 'tsx', // @TODO
                    }
                  })

                  cacheable = false // don't allow cache recursive assets

                  return {
                    path: pathname,
                    namespace: "virtual",
                  };
                }
              }
            }

            return { path: args.path, external: true };
          });

          // Handles the "virtual" namespace to return file contents
          build.onLoad({ filter: /.*/, namespace: "virtual" }, async (args) => {
            const file = await files[args.path]

            if (!file) return null

            if (replaceImportMeta) {
              // file.src means that file was fetched from server - we should replace import.meta.url
              const shouldReplace = file.src || !entryPoints.includes(args.path)
              if (shouldReplace) {
                const href = new URL(args.path, baseURI).href
                file.contents = file.contents.replace(
                  /import\.meta\.url/g,
                  `/* import.meta.url */'${href}'`,
                );
                file.contents = file.contents.replace(
                  /import\.meta\.resolve/g,
                  `/* import.meta.resolve */((path) => new URL(path, '${href}').href)`,
                );
              }
            }

            if (replaceDynamicImport) {
              const pathname = new URL(args.path, baseURI).pathname
              file.contents = file.contents.replace(
                /import\(/g,
                `/*! importer:${pathname} */import(`,
              );
            }

            return {
              contents: file.contents,
              loader: file.loader,
            };
          });

          build.onEnd((result) => {
            if (replaceDynamicImport) {
              result.outputFiles.forEach(outputFile => {
                const textString = outputFile.text.replace(
                  /\/\*\! importer:(.+) \*\/[\n\W]*import\(/g,
                  (_substring, importer) => {
                    return `/* import() - ${importer} */(async (path, options = {}) => {
                    // handle relative paths only
                    if (!['/', './', '../'].some(prefix => path.startsWith(prefix))) {
                      return import(path, options)
                    }

                    // skip json imports
                    if (path.includes('.json')) {
                      return import(path, options)
                    }

                    const importer = '${importer}';

                    const buildOptions = ${JSON.stringify(options)}

                    const resolvedPath = new URL(path, new URL(importer, buildOptions.baseURI)).pathname

                    const resolvedPathKey = [
                      '${pluginName}',
                      'modules',
                      resolvedPath,
                    ].join(':')

                    // @NOTE: prevents recursive infinite imports (e.g. a.js -> b.js -> a.js -> ...)
                    // and prevents duplications (not at all)
                    if (globalThis[resolvedPathKey]) {
                      return globalThis[resolvedPathKey]
                    }

                    globalThis[resolvedPathKey] = Promise.resolve().then(async () => {
                      const resolvedPathFetchKey = [
                        '${pluginName}',
                        'fetch',
                        resolvedPath,
                      ].join(':')

                      // caching asset
                      globalThis[resolvedPathFetchKey] = globalThis[resolvedPathFetchKey] || fetch(resolvedPath, {
                        headers: {
                          Accept: 'application/javascript, text/javascript, text/plain, text/jsx, text/babel, */*'
                        }
                      }).then(r => r.text())

                      const [esbuild, esbuildStandalone, content] = await Promise.all([
                        import('https://esm.sh/esbuild-wasm@0.27.0'),
                        import('${import.meta.resolve('./index.js') || `https://esm.sh/esbuild-standalone@${version}/sdk`}'),
                        globalThis[resolvedPathFetchKey],
                      ])

                      const cacheKey = [
                        '${pluginName}',
                        await esbuildStandalone.generateHashKey(content, buildOptions),
                      ].join('/')

                      const cachedResult = localStorage.getItem(cacheKey)

                      if (cachedResult) {
                        return import(cachedResult, options)
                      }

                      const files = {
                        [resolvedPath]: {
                          contents: content,
                          loader: 'tsx', // @TODO
                          src: resolvedPath,
                        }
                      }

                      const { output, cacheable } = await esbuildStandalone.buildDynamicImport(esbuild.default, files, buildOptions)

                      if (cacheable) {
                        localStorage.setItem(cacheKey, output)
                      }

                      return import(output, options)
                    })

                    return globalThis[resolvedPathKey]
                  })(`
                  }
                );

                const encoder = new TextEncoder();
                const uint8Array = encoder.encode(textString);
                outputFile.contents = uint8Array
              })
            }
          })
        },
      },
    ],
    ...esbuildOptions,
  });

  const bundledCode = result.outputFiles?.[0]?.text;

  return {
    output: bundledCode,
    cacheable,
  }
}

export async function buildDynamicImport(esbuild, files, options) {
  const { output, cacheable } = await build(esbuild, files, options)
  return { output: `data:text/javascript,${encodeURIComponent(output)}`, cacheable }
}