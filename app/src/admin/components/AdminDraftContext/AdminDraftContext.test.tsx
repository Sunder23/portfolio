import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AdminDraftProvider, useAdminDraft } from '@/admin/components/AdminDraftContext'

function DraftProbe() {
  const draft = useAdminDraft()
  const value = draft.getEntry<{ title: string }>('data/profile.json')

  return (
    <div>
      <span data-testid="dirty-count">{draft.dirtyPaths.length}</span>
      <span data-testid="title">{value?.title ?? ''}</span>
      <button onClick={() => draft.captureBaseline('data/profile.json', { title: 'baseline' })}>load</button>
      <button onClick={() => draft.setEntry('data/profile.json', { title: 'edited' })}>edit</button>
      <button onClick={() => draft.clearAll()}>clear</button>
    </div>
  )
}

describe('AdminDraftContext', () => {
  it('throws when useAdminDraft is used outside the provider', () => {
    expect(() => renderHook(() => useAdminDraft())).toThrow('useAdminDraft must be used within AdminDraftProvider')
  })

  it('marks an entry dirty after setEntry diverges from the captured baseline, and clean again after captureBaseline', async () => {
    const user = userEvent.setup()
    render(
      <AdminDraftProvider>
        <DraftProbe />
      </AdminDraftProvider>,
    )

    await user.click(screen.getByText('load'))
    expect(screen.getByTestId('dirty-count')).toHaveTextContent('0')

    await user.click(screen.getByText('edit'))
    expect(screen.getByTestId('title')).toHaveTextContent('edited')
    expect(screen.getByTestId('dirty-count')).toHaveTextContent('1')

    await user.click(screen.getByText('load'))
    expect(screen.getByTestId('dirty-count')).toHaveTextContent('0')
  })

  it('clearAll empties dirtyPaths', async () => {
    const user = userEvent.setup()
    render(
      <AdminDraftProvider>
        <DraftProbe />
      </AdminDraftProvider>,
    )

    await user.click(screen.getByText('load'))
    await user.click(screen.getByText('edit'))
    expect(screen.getByTestId('dirty-count')).toHaveTextContent('1')

    await user.click(screen.getByText('clear'))
    expect(screen.getByTestId('dirty-count')).toHaveTextContent('0')
  })
})
