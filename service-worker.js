// @NOTE: UMD "esbuildStandalone" import (firefox doesn't support 'module' type for SW)
importScripts('https://unpkg.com/esbuild-standalone/umd/sdk.umd.js')
// importScripts('/umd/sdk.umd.js')

// @NOTE: UMD "esbuildStandalone" import (firefox doesn't support 'module' type for SW)
importScripts('https://unpkg.com/esbuild-wasm@0.25.11/lib/browser.js')

self.addEventListener('install', function (event) {
  self.skipWaiting()
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", async (event) => {
  if (event.request.destination === 'script' && event.request.url.startsWith(self.location.origin) && event.request.url.match(/\.(jsx|ts|tsx|css|vue)/)) {
    event.respondWith((async () => {
      const pathname = new URL(event.request.url).pathname

      const text = await fetch(event.request).then(target => target.text());

      const [cacheKey, cache] = await Promise.all([esbuildStandalone.generateHash(text), caches.open('esbuild-cache')])
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

      const bundledCode = await esbuildStandalone.build(esbuild, virtualFiles);

      const networkResponse = new Response(bundledCode, {
        headers: { 'Content-Type': 'application/javascript' }
      })

      await cache.put(cacheKey, networkResponse.clone());

      return networkResponse
    })())
  }
});
