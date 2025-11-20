esbuild alternative for [@babel/standalone](https://babeljs.io/docs/babel-standalone) built with [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and [esbuild-wasm](https://www.npmjs.com/package/esbuild-wasm)

`esbuild-standalone` is a script that allows you to write JSX/TSX directly in HTML without any build steps. Your source code is sent to the Service Worker, compiled, cached, and served to the browser as a JavaScript module.

## Installation

### Service Worker Setup

In your "public" directory

1) create file `service-worker.js` (for "classic" sw type support)

```js
// /service-worker.js
importScripts('https://unpkg.com/esbuild-standalone@latest/service-worker.js')
```

File should be available here: `http://{domain}/service-worker.js`

2) create file `service-worker.mjs` (for "module" sw type support)

```js
// /service-worker.mjs
import 'https://unpkg.com/esbuild-standalone@latest/service-worker.mjs'
```

File should be available here: `http://{domain}/service-worker.mjs`

## Usage

Supported script types:
- `text/babel`
- `text/esbuild`
- `text/jsx`
- `text/tsx`
- `text/ts`
- `text/vue`

### Inline (no SW setup required)

Package: `https://esm.sh/esbuild-standalone`

Create `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- @IMPORTANT: ?external is required for singleton libraries (e.g. react) -->
    <!-- @NOTE: More info: https://esm.sh/ -->
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react/jsx-runtime": "https://esm.sh/react@19.0.0/jsx-runtime.js?external=react",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client?external=react"
      }
    }
    </script>
    <script src="https://esm.sh/esbuild-standalone" type="module"></script>

    <!-- Every script with "text/babel" will be built and executed with esbuild-wasm  -->
    <script type="text/babel">
      import { useState } from 'react';
      import { createRoot } from 'react-dom/client';

      export function Button() {
        const [count, setCount] = useState(0)
        return <button onClick={() => setCount(v => v + 1)}>
          Count: {count}
        </button>
      }

      export function App({ name }) {
        return <div>
          <h2>Hello, {name}</h2>
          <Button />
        </div>
      }

      const div = document.createElement('div')
      document.body.append(div)
      const root = createRoot(div)
      root.render(<App name="App" />)
    </script>
  </head>
  <body>
  </body>
</html>
```

### External (SW setup required)

Package: `https://esm.sh/esbuild-standalone/sw`

Create `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- @IMPORTANT: ?external is required for singleton libraries (e.g. react) -->
    <!-- @NOTE: More info: https://esm.sh/ -->
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react/jsx-runtime": "https://esm.sh/react@19.0.0/jsx-runtime.js?external=react",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client?external=react"
      }
    }
    </script>
    <!-- @IMPORTANT: Requires Service Worker Setup -->
    <!-- /service-worker.js and /service-worker.mjs should be available -->
    <script src="https://esm.sh/esbuild-standalone/sw" type="module"></script>

    <!-- @NOTE: You can provide url to service-worker.js file -->
    <!-- <script src="https://esm.sh/esbuild-standalone/sw?url=/sw.js" type="module"></script> -->

    <!-- Every script with "text/esbuild" will be built and executed with esbuild-wasm too  -->
    <script src="index.tsx" type="text/esbuild"></script>
    <!-- type="module" works too -->
    <!-- <script src="index.tsx" type="module"></script> -->
  </head>
  <body>
  </body>
</html>
```

Create `index.tsx` file:

```tsx
import { createRoot } from 'react-dom/client';

import { App } from './app.jsx' // import via service worker

const root = createRoot(document.getElementById("root"))
root.render(<App />)
```

Create `app.jsx` file:

```tsx
function App({ name }) {
  return <div>
    <h2>Hello, {name}</h2>
  </div>
}

export { App }
```

## References

- https://babeljs.io/docs/babel-standalone
- https://www.cacoos.com/blog/compiling-in-the-browser
- https://github.com/esm-dev/tsx (https://esm.sh/#tsx)
- https://github.com/guybedford/es-module-shims
