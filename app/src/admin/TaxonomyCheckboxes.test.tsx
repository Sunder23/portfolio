import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaxonomyCheckboxes } from '@/admin/TaxonomyCheckboxes'

const TERMS = ['React', 'TypeScript', 'WordPress']

describe('TaxonomyCheckboxes', () => {
  it('renders one checkbox per term with the correct checked state', () => {
    render(<TaxonomyCheckboxes terms={TERMS} selected={['React']} onChange={vi.fn()} />)

    expect(screen.getByRole('checkbox', { name: 'React' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'TypeScript' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'WordPress' })).not.toBeChecked()
  })

  it('adds a term to selected when an unchecked checkbox is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TaxonomyCheckboxes terms={TERMS} selected={['React']} onChange={onChange} />)

    await user.click(screen.getByRole('checkbox', { name: 'TypeScript' }))

    expect(onChange).toHaveBeenCalledWith(['React', 'TypeScript'])
  })

  it('removes a term from selected when a checked checkbox is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TaxonomyCheckboxes terms={TERMS} selected={['React', 'TypeScript']} onChange={onChange} />)

    await user.click(screen.getByRole('checkbox', { name: 'React' }))

    expect(onChange).toHaveBeenCalledWith(['TypeScript'])
  })
})
