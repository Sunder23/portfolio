import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AdminDraftProvider, useAdminDraft } from '@/admin/components/AdminDraftContext'

const STORAGE_KEY = 'admin-draft-v1'

// The draft store degrades gracefully when localStorage throws (see persistEntries/
// loadInitialEntries) — tests shouldn't depend on it succeeding either.
function safeClearDraftStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignored — see comment above
  }
}

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
  beforeEach(() => {
    safeClearDraftStorage()
  })

  afterEach(() => {
    safeClearDraftStorage()
  })

  it('throws when useAdminDraft is used outside the provider', () => {
    expect(() => renderHook(() => useAdminDraft())).toThrow('useAdminDraft must be used within AdminDraftProvider')
  })

  it('marks an entry dirty after setEntry diverges from the captured baseline', async () => {
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
  })

  // [FIX] captureBaseline used to unconditionally overwrite data+baseline on every call, so
  // re-mounting any consumer of a path (e.g. navigating away from an editor and back) reset an
  // in-progress, unsaved edit back to whatever was last loaded — this was the reported bug
  // behind "editing taxonomy, then navigating to add a project, loses the taxonomy edit".
  it('does not overwrite an in-progress draft when captureBaseline is called again for the same path', async () => {
    const user = userEvent.setup()
    render(
      <AdminDraftProvider>
        <DraftProbe />
      </AdminDraftProvider>,
    )

    await user.click(screen.getByText('load'))
    await user.click(screen.getByText('edit'))
    expect(screen.getByTestId('title')).toHaveTextContent('edited')
    expect(screen.getByTestId('dirty-count')).toHaveTextContent('1')

    // Simulates a consumer of this path re-mounting (e.g. navigating back to the editor, or
    // an unrelated editor loading the same shared file) and re-fetching+re-capturing.
    await user.click(screen.getByText('load'))
    expect(screen.getByTestId('title')).toHaveTextContent('edited')
    expect(screen.getByTestId('dirty-count')).toHaveTextContent('1')
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
