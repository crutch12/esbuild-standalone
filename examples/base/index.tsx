import { createRoot } from 'react-dom/client';

import { App } from './app.jsx' // import via service worker

const root = createRoot(document.getElementById('root'))
root.render(<App name="esbuild-standalone" />)
