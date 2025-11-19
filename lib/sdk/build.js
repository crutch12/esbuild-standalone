import { version, pluginName } from './meta.js'

let esbuildInitialized = undefined

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

  if (!esbuildInitialized) {
    esbuildInitialized = esbuild.initialize({
      worker: !inWorker,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.27.0/esbuild.wasm',
      // wasmURL: 'https://cdn.skypack.dev/esbuild-wasm@0.27.0/esbuild.wasm',
    })
  }

  await esbuildInitialized;

  const { esbuildOptions, recursive = false, baseURI = undefined } = options || {}

  let cacheable = true

  const result = await esbuild.build({
    entryPoints: Object.keys(files),
    bundle: true,
    format: "esm",
    write: false,
    jsx: 'automatic',
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
    plugins: [
      {
        name: "virtual-files",
        setup(build) {

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

                  files[pathname] = fetch(pathname).then(async (res) => {
                    return {
                      contents: await res.text(),
                      loader: 'tsx', // @TOFO
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
          build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
            return files[args.path] || null;
          });
        },
      },
    ],
    ...esbuildOptions,
  });

  const bundledCode = result.outputFiles?.[0]?.text;

  const output = [
    `// ${pluginName}`,
    `// build-date:${new Date().toISOString()}`,
    bundledCode,
  ].join('\n')

  return {
    output,
    cacheable,
  }
}