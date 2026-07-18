import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useDirtyState } from '@/admin/hooks/useDirtyState'

interface Payload {
  name: string
}

const ORIGINAL: Payload = { name: 'original' }
const CHANGED: Payload = { name: 'changed' }

function Probe() {
  const { capture, isDirty } = useDirtyState<Payload>()
  const [value, setValue] = useState<Payload>(ORIGINAL)

  return (
    <div>
      <span data-testid="state">{isDirty(value) ? 'dirty' : 'clean'}</span>
      <button onClick={() => capture(value)}>capture</button>
      <button onClick={() => setValue(CHANGED)}>change</button>
      <button onClick={() => setValue({ ...ORIGINAL })}>revert</button>
    </div>
  )
}

describe('useDirtyState', () => {
  it('is not dirty before capture is ever called', () => {
    render(<Probe />)
    expect(screen.getByTestId('state')).toHaveTextContent('clean')
  })

  it('is clean right after capturing the current value', async () => {
    const user = userEvent.setup()
    render(<Probe />)
    await user.click(screen.getByText('capture'))
    expect(screen.getByTestId('state')).toHaveTextContent('clean')
  })

  it('becomes dirty once the value diverges from the captured baseline', async () => {
    const user = userEvent.setup()
    render(<Probe />)
    await user.click(screen.getByText('capture'))
    await user.click(screen.getByText('change'))
    expect(screen.getByTestId('state')).toHaveTextContent('dirty')
  })

  it('is clean again after reverting to the captured value (deep equality, new object reference)', async () => {
    const user = userEvent.setup()
    render(<Probe />)
    await user.click(screen.getByText('capture'))
    await user.click(screen.getByText('change'))
    expect(screen.getByTestId('state')).toHaveTextContent('dirty')
    await user.click(screen.getByText('revert'))
    expect(screen.getByTestId('state')).toHaveTextContent('clean')
  })
})
