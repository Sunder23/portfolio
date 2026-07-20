import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectFilters } from '@/pages/Projects/ProjectFilters'
import { EMPTY_PROJECT_FILTER, type ProjectFilterOptions } from '@/lib/projectFilters'

const OPTIONS: ProjectFilterOptions = {
  roles: ['Fullstack developer', 'WordPress developer'],
  stacks: ['React', 'PHP'],
  categories: ['Web', 'CMS'],
}

describe('ProjectFilters', () => {
  it('renders a tab per role plus an "all" tab, and one toggle button per stack/category option', () => {
    render(<ProjectFilters options={OPTIONS} value={EMPTY_PROJECT_FILTER} onChange={vi.fn()} />)

    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'React' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'CMS' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the selected role when a role tab is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ProjectFilters options={OPTIONS} value={EMPTY_PROJECT_FILTER} onChange={onChange} />)

    await user.click(screen.getByRole('tab', { name: 'WordPress developer' }))

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_PROJECT_FILTER, role: 'WordPress developer' })
  })

  it('adds a stack term when its chip is clicked and removes it when clicked again', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<ProjectFilters options={OPTIONS} value={EMPTY_PROJECT_FILTER} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'React' }))
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_PROJECT_FILTER, stack: ['React'] })

    rerender(<ProjectFilters options={OPTIONS} value={{ ...EMPTY_PROJECT_FILTER, stack: ['React'] }} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'React' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'React' }))
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_PROJECT_FILTER, stack: [] })
  })

  it('only shows the reset action when a filter is active, and clears all filters on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<ProjectFilters options={OPTIONS} value={EMPTY_PROJECT_FILTER} onChange={onChange} />)

    expect(screen.queryByRole('button', { name: 'projects.filter.reset' })).not.toBeInTheDocument()

    rerender(<ProjectFilters options={OPTIONS} value={{ ...EMPTY_PROJECT_FILTER, category: ['Web'] }} onChange={onChange} />)
    const resetButton = screen.getByRole('button', { name: 'projects.filter.reset' })

    await user.click(resetButton)
    expect(onChange).toHaveBeenCalledWith(EMPTY_PROJECT_FILTER)
  })
})
