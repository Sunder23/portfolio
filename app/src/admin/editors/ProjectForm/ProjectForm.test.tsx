import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAuthProvider } from '@/admin/context/AdminAuthContext'
import { AdminDraftProvider } from '@/admin/context/AdminDraftContext'
import { AdminLocaleProvider } from '@/admin/context/AdminLocaleContext'
import { SaveAllButton } from '@/admin/components/SaveAllButton'
import { storePat, clearPat } from '@/admin/lib/pat'
import { ProjectForm } from '@/admin/editors/ProjectForm'

vi.mock('@/admin/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/admin/lib/github')>()
  return {
    ...actual,
    getFile: vi.fn(),
    listDir: vi.fn(),
  }
})

import { getFile, listDir } from '@/admin/lib/github'

const DRAFT_STORAGE_KEY = 'admin-draft-v1'

function renderNewProjectForm() {
  return render(
    <AdminAuthProvider>
      <AdminLocaleProvider>
        <AdminDraftProvider>
          <MemoryRouter initialEntries={['/admin/projects/new']}>
            <Routes>
              <Route path="/admin/projects/new" element={<ProjectForm />} />
            </Routes>
          </MemoryRouter>
          <SaveAllButton />
        </AdminDraftProvider>
      </AdminLocaleProvider>
    </AdminAuthProvider>,
  )
}

describe('ProjectForm — new project', () => {
  beforeEach(() => {
    storePat('test-token')
    vi.mocked(listDir).mockResolvedValue([])
    vi.mocked(getFile).mockResolvedValue({ data: { stack: [], category: [], role: [] }, sha: 'sha-taxonomies' })
  })

  afterEach(() => {
    clearPat()
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    vi.mocked(listDir).mockReset()
    vi.mocked(getFile).mockReset()
  })

  // [FIX] slugify('') falls back to 'untitled', and an effect used to write that fallback into
  // the draft on every mount (to auto-preview a slug from the title) — so simply opening "Add
  // project" without typing anything made the draft dirty and showed "Save all (1)" for no
  // reason. The slug display already falls back to "untitled" on its own; nothing should be
  // staged until there's a real title.
  it('does not mark the draft dirty just from opening the page — no title typed yet', async () => {
    renderNewProjectForm()

    await waitFor(() => expect(screen.getByText('Новый проект')).toBeInTheDocument())
    // Give any effects (including the auto-slug one) a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.queryByText(/Сохранить всё/)).not.toBeInTheDocument()
  })

  it('marks the draft dirty once a title is actually typed', async () => {
    const user = userEvent.setup()
    renderNewProjectForm()

    await waitFor(() => expect(screen.getByText('Новый проект')).toBeInTheDocument())
    // LocalizedField renders a bare <label> next to its <input> with no htmlFor/id association,
    // so getByLabelText can't find it — locate the title input via its label's sibling instead.
    const titleLabel = screen.getByText('title')
    const titleInput = titleLabel.parentElement?.querySelector('input')
    if (!titleInput) throw new Error('title input not found')
    await user.type(titleInput, 'My project')

    await waitFor(() => expect(screen.getByText(/Сохранить всё \(1\)/)).toBeInTheDocument())
  })
})
