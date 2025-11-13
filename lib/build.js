
import esbuild from 'https://esm.sh/esbuild-wasm@0.25.11';
// import esbuild from 'https://cdn.skypack.dev/esbuild-wasm@0.25.11';

const inWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope

const esbuildInitialized = esbuild.initialize({
  worker: !inWorker,
  wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.11/esbuild.wasm',
  // wasmURL: 'https://cdn.skypack.dev/esbuild-wasm@0.25.11/esbuild.wasm',
})

// @TODO: handle importmap
// @TODO: support jsxImportSource (e.g. vue/preact/solid-js)
export async function build(files) {
  await esbuildInitialized;

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

            return { path: args.path, external: true };
          });

          // Handles the "virtual" namespace to return file contents
          build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
            return files[args.path] || null;
          });
        },
      },
    ],
  });

  const bundledCode = result.outputFiles?.[0]?.text;

  return bundledCode
}