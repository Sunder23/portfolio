import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CommandLabel } from '@/components/CommandLabel'

describe('CommandLabel', () => {
  it('renders the "$ " prompt prefix followed by the children', () => {
    render(<CommandLabel>ls ./projects</CommandLabel>)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('$ ls ./projects')
  })

  it('renders as the given heading level', () => {
    render(<CommandLabel as="h1">cat about.md</CommandLabel>)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('$ cat about.md')
  })

  it('exposes a human-readable accessible name when label is given', () => {
    render(<CommandLabel label="About me">cat about.md</CommandLabel>)

    expect(screen.getByRole('heading', { name: 'About me' })).toHaveTextContent('$ cat about.md')
  })
})
