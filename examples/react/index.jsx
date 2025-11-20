
import { createRoot } from 'react-dom/client';

import { App } from './app.jsx'

const div = document.createElement('div')
document.body.append(div)
const root = createRoot(div)
root.render(<App name="external script App (SW required)" />)