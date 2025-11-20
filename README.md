`esbuild-standalone` provides a standalone build of [Esbuild](https://esbuild.github.io/) for use in browsers. Made with [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and [esbuild-wasm](https://www.npmjs.com/package/esbuild-wasm).

It's alternative for [@babel/standalone](https://babeljs.io/docs/babel-standalone) and [esm.sh/tsx](https://esm.sh/#tsx).

## When (not) to use esbuild-standalone

If you're using Esbuild in production, you should normally not use `esbuild-standalone`. Instead, you should use a build system running on Node.js, such as Esbuild or Vite, to transpile your JS ahead of time.

However, there are some valid use cases for esbuild-standalone:

- It provides an easy, convenient way to prototype with Esbuild. Using `esbuild-standalone`, you can get started using Esbuild with just a simple script tag in your HTML.
- You want to write html pages that require transpilation (e.g. in confluence) without additional build/deploy stages.
- You want to check your es6 code as quickly as possible, just using `index.html`

## How it works

`esbuild-standalone` is a script that allows you to write JSX/TSX directly in HTML without any build steps. Your source code is sent to the Service Worker, compiled, cached, and served to the browser as a JavaScript module.

It also may work without Service Worker setup, but with limitations.

## Installation

### Service Worker Setup

In your "public"/"root" directory

1) create file `service-worker.js` (for "classic" sw type support)

```js
// /service-worker.js
importScripts('https://unpkg.com/esbuild-standalone@latest/service-worker.js')
```

2) create file `service-worker.mjs` (for "module" sw type support)

```js
// /service-worker.mjs
import 'https://unpkg.com/esbuild-standalone@latest/service-worker.mjs'
```

Files should be available here:

- `https://{domain}/service-worker.js`
- `https://{domain}/service-worker.mjs`

> [!NOTE]
> You can specify any `service-worker.js`/`service-worker.mjs` path with `data-sw-url`/`data-sw-esm-url` options. See [Options](#options).

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
      root.render(<App name="esbuild-standalone" />)
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

    <!-- @NOTE: You can provide data-sw-url to your service-worker.js file -->
    <!-- <script
      src="https://esm.sh/esbuild-standalone/sw"
      type="module"
      id="esbuild-standalone"
      data-sw-url="/sw.js">
    </script> -->

    <!-- Every script with "text/esbuild" will be built and executed with esbuild-wasm too  -->
    <script src="index.tsx" type="text/esbuild"></script>

    <!-- type="module" works too (thanks to Service Worker) -->
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

const div = document.createElement('div')
document.body.append(div)
const root = createRoot(div)
root.render(<App name="esbuild-standalone" />)
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

## Options

### Options API

> [!NOTE]
> If specified path is relative (e.g. `data-tsconfig="./tsconfig.json"`), it is resolved relatively to current page `document.baseURI` value.

```tsx
type Options = {
  config: string | undefined, // e.g. "./esbuild.config.json"
  tsconfig: string | undefined, // e.g. "https://raw.githubusercontent.com/crutch12/esbuild-standalone/refs/heads/master/examples/preact/tsconfig.json"
  // Service Worker setup options
  swUrl: string | undefined, // e.g. /sw.js
  swEsmUrl: string | undefined, // e.g. /sw.mjs
  swType: 'classic' | 'module' | undefined,
  swScope: string | undefined, // e.g. /pages
  swUpdateViaCache: 'all' | 'imports' | 'none' | undefined
}
```

### Usage 1. Specify with script `data-* attributes`

> [!NOTE]
> `id="esbuild-standalone"` is required for `data-* attributes` usage.

```html
<script
  src="https://esm.sh/esbuild-standalone/sw"
  type="module"
  id="esbuild-standalone"
  data-sw-url="./service-worker.mjs"
  data-tsconfig="./tsconfig.json"
  data-config="./esbuild.config.json">
</script>
```

### Usage 2. Specify with url search params

```html
<script src="https://esm.sh/esbuild-standalone/es2022/sw.mjs?config=./esbuild.config.json" type="module"></script>
```

### Usage 3. Specify with `window.esbuildStandaloneOptions`

```html
<script>
  window.esbuildStandaloneOptions = {
    swUrl: '/service-worker.js',
    swEsmUrl: '/service-worker.mjs',
    tsconfig: './tsconfig.json',
  }
</script>
<script src="https://esm.sh/esbuild-standalone/sw"></script>
```

## Examples

All examples (react/preact/etc.) available here:

- https://crutch12.github.io/esbuild-standalone/examples ([source code](https://github.com/crutch12/esbuild-standalone/blob/master/examples))

## References

- https://babeljs.io/docs/babel-standalone
- https://github.com/esm-dev/tsx (https://esm.sh/#tsx)
- https://github.com/guybedford/es-module-shims
- https://www.cacoos.com/blog/compiling-in-the-browser
