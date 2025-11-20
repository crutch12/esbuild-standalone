import { Button } from './button.tsx'

function App({ name }) {
  return <div>
    <h2>Hello, {name}</h2>
    <Button />
  </div>
}

export { App }