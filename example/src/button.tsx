import { useState } from 'react'
import { styled } from 'styled-components'


export function Button() {
  const [count, setCount] = useState(0)
  return <StyledButton onClick={() => setCount(v => v + 1)}>
    Count: {count}
  </StyledButton>
}

const StyledButton = styled.button`
  color: red;
`
