import { build } from 'https://esm.sh/esbuild-standalone/build';
// import { build } from '/lib/build.js';

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

      const target = await fetch(event.request);
      const text = await target.text()

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

      const bundledCode = await build(virtualFiles);

      return new Response(bundledCode, {
        headers: { 'Content-Type': 'application/javascript' }
      })
    })())
  }
});
