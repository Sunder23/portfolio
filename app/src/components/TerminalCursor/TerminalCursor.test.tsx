import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TerminalCursor } from '@/components/TerminalCursor'

describe('TerminalCursor', () => {
  it('renders an aria-hidden blinking cursor glyph', () => {
    const { container } = render(<TerminalCursor />)

    const cursor = container.querySelector('span')
    expect(cursor).not.toBeNull()
    expect(cursor).toHaveAttribute('aria-hidden', 'true')
    expect(cursor).toHaveTextContent('_')
  })
})
