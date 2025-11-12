esbuild analog for [@babel/standalone](https://babeljs.io/docs/babel-standalone) built with [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and [esbuild-wasm](https://www.npmjs.com/package/esbuild-wasm)

## Installation

> [!IMPORTANT]
> Service Worker setup is required to preprocess files from relative import usages.
> If use only `inline` scripts and don't use relative non-js imports (e.g. `import {App} from './App.tsx'`), then you may skip Service Worker Setup.

### Service Worker Setup

Using npm:

```sh
npx esbuild-standalone init
```

Manually:

- copy file https://unpkg.com/esbuild-standalone@latest/service-worker.js in your project (public) root

## Usage

Supported script types:
- `text/babel`
- `text/esbuild`
- `text/jsx`
- `text/tsx`
- `text/ts`
- `text/vue`

### Inline

Package: `https://esm.sh/esbuild-standalone`

Create `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- @IMPORTANT: ?deps is required for singleton libraries (e.g. react) -->
    <!-- @NOTE: More info: https://esm.sh/ -->
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react/jsx-runtime": "https://esm.sh/react@19.0.0/jsx-runtime.js?deps=react@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client?deps=react@19.0.0"
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

### External (src)

Package: `https://esm.sh/esbuild-standalone/sw`

Create `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- @IMPORTANT: ?deps is required for singleton libraries (e.g. react) -->
    <!-- @NOTE: More info: https://esm.sh/ -->
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react/jsx-runtime": "https://esm.sh/react@19.0.0/jsx-runtime.js?deps=react@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client?deps=react@19.0.0"
      }
    }
    </script>
    <script src="https://esm.sh/esbuild-standalone/sw" type="module"></script>

    <!-- Every script with "text/esbuild" will be built and executed with esbuild-wasm too  -->
    <script src="index.tsx" type="text/esbuild"> </script>
  </head>
  <body>
  </body>
</html>
```

Create `index.tsx` file:

```tsx
import { createRoot } from 'react-dom/client';

import { App } from './app.js' // import via service worker

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
- https://github.com/esm-dev/tsx
