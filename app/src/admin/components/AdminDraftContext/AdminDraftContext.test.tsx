import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

function RaceProbe() {
  const draft = useAdminDraft()
  return (
    <div>
      <button
        onClick={() => {
          draft.captureBaseline('race-path', { img: null })
          draft.setEntry('race-path', { img: { blob: new Blob(['x']), previewUrl: 'blob:x' } })
        }}
      >
        stage-image
      </button>
      <button onClick={() => draft.clearEntry('race-path')}>clear</button>
    </div>
  )
}

describe('AdminDraftContext localStorage persist race', () => {
  let deferredLoads: (() => void)[]

  beforeEach(() => {
    safeClearDraftStorage()
    deferredLoads = []
    // Serializing a staged image goes through FileReader (see blobToDataUrl in
    // AdminDraftContext) — stubbing it out lets the test control exactly when that slow
    // path resolves, instead of hoping real jsdom I/O happens to finish in a particular order.
    class DeferredFileReader {
      result: string | null = null
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsDataURL() {
        deferredLoads.push(() => {
          this.result = 'data:application/octet-stream;base64,eA=='
          this.onload?.()
        })
      }
    }
    vi.stubGlobal('FileReader', DeferredFileReader)
  })

  afterEach(() => {
    safeClearDraftStorage()
    vi.unstubAllGlobals()
  })

  // [FIX] persistEntries used to have no defense against out-of-order async completion: two
  // rapid entries changes each scheduled their own fire-and-forget persist call, and a slower
  // earlier one (e.g. base64-encoding a staged image) finishing after a faster later one (e.g.
  // clearEntry after a save) would overwrite localStorage with stale, already-superseded data —
  // even though in-memory state was already correct. This was the likely cause behind "Save
  // all" reappearing with a stale dirty count after the post-save reload rehydrated that stale
  // localStorage snapshot.
  it('does not let a slow, superseded persist overwrite a newer, faster clear', async () => {
    render(
      <AdminDraftProvider>
        <RaceProbe />
      </AdminDraftProvider>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByText('stage-image'))
    // The image-serializing persist for 'race-path' is now in flight, blocked on our stub.
    await user.click(screen.getByText('clear'))
    // clearEntry's persist has no images (fast, synchronous removeItem branch) and should have
    // already completed and won the race by the time we get here.
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    // Now let the earlier, now-stale image persist finish and attempt its write.
    expect(deferredLoads).toHaveLength(1)
    deferredLoads[0]()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
