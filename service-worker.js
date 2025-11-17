// @NOTE: UMD "esbuildStandalone" import (firefox doesn't support 'module' type for SW)
importScripts('https://unpkg.com/esbuild-standalone@0.0.10/umd/sdk.umd.js')
// importScripts('/umd/sdk.umd.js')

// @NOTE: UMD "esbuild" import (firefox doesn't support 'module' type for SW)
importScripts('https://unpkg.com/esbuild-wasm@0.27.0/lib/browser.js')

self.addEventListener('install', function (event) {
  self.skipWaiting()
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

function getBuildParams() {
  const url = new URL(self.location.href)
  return {
    config: url.searchParams.get('config'),
    tsconfig: url.searchParams.get('tsconfig'),
  }
}

self.addEventListener("fetch", async (event) => {
  if (event.request.destination !== 'script') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const match = event.request.url.match(/\.(jsx|ts|tsx|css|vue)/)

  if (match) {
    event.respondWith((async () => {
      const pathname = new URL(event.request.url).pathname

      const [text, { config, tsconfig }] = await Promise.all([
        fetch(event.request).then(target => target.text()),
        esbuildStandalone.fetchBuildConfigs(getBuildParams()),
      ]);

      const [cacheKey, cache] = await Promise.all([
        esbuildStandalone.generateHashKey(text, tsconfig, config),
        caches.open(`${esbuildStandalone.pluginName}@${esbuildStandalone.version}`)
      ])

      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        return cachedResponse;
      }

      const getLoader = (filename) => {
        // const loader = {
        //   '.js': 'js', // Treat .js files as JSX
        //   '.jsx': 'jsx', // Treat .js files as JSX
        //   '.ts': 'ts',   // Treat .ts files as TypeScript
        //   '.tsx': 'tsx', // Treat .tsx files as TypeScript with JSX
        //   '.css': 'css', // Treat .css files as CSS
        //   '.json': 'json', // Treat .json files as JSON
        //   '.vue': 'tsx', // Vue isn't supported by esbuild
        //   // '.png': 'file', // Copy .png files as-is (e.g., to the output directory)
        // }

        if (filename.includes('.css')) {
          return 'css'
        }

        if (filename.includes('.json')) {
          return 'json'
        }

        return 'tsx'
      }

      const virtualFiles = {
        [pathname]: {
          contents: text,
          loader: getLoader(pathname),
        },
        // "@/components/ui/button": {
        //   contents: `...`,
        //   loader: "tsx",
        // },
      };

      const esbuildOptions = {
        ...config,
        ...(tsconfig ? { tsconfigRaw: tsconfig } : undefined),
      }

      const bundledCode = await esbuildStandalone.build(esbuild, virtualFiles, esbuildOptions);

      const networkResponse = new Response(bundledCode, {
        headers: { 'Content-Type': 'application/javascript' }
      })

      await cache.put(cacheKey, networkResponse.clone());

      return networkResponse
    })())
  }
});
