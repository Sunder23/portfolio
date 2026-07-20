import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAuthProvider } from '@/admin/context/AdminAuthContext'
import { AdminDraftProvider } from '@/admin/context/AdminDraftContext'
import { storePat, clearPat } from '@/admin/lib/pat'
import TaxonomyEditor from '@/admin/editors/TaxonomyEditor'

vi.mock('@/admin/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/admin/lib/github')>()
  return {
    ...actual,
    getFile: vi.fn(),
    listDir: vi.fn(),
    saveFile: vi.fn(),
  }
})

import { getFile, listDir, saveFile } from '@/admin/lib/github'

// AdminDraftProvider now mirrors its state to localStorage (see AdminDraftContext), so a
// staged-but-unsaved change from one test would otherwise leak into the next test's fresh
// provider instance — clear it alongside the PAT in every describe block below.
const DRAFT_STORAGE_KEY = 'admin-draft-v1'

function renderEditor() {
  return render(
    <AdminAuthProvider>
      <AdminDraftProvider>
        <MemoryRouter initialEntries={['/admin/taxonomies/stack']}>
          <Routes>
            <Route path="/admin/taxonomies/:key" element={<TaxonomyEditor />} />
          </Routes>
        </MemoryRouter>
      </AdminDraftProvider>
    </AdminAuthProvider>,
  )
}

describe('TaxonomyEditor rename no-op guard', () => {
  beforeEach(() => {
    storePat('test-token')
    vi.mocked(getFile).mockResolvedValue({
      data: { stack: ['React', 'Vue'], category: [], role: [] },
      sha: 'sha-taxonomies',
    })
    vi.mocked(listDir).mockResolvedValue([])
    vi.mocked(saveFile).mockResolvedValue(undefined)
  })

  afterEach(() => {
    clearPat()
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    vi.mocked(getFile).mockReset()
    vi.mocked(listDir).mockReset()
    vi.mocked(saveFile).mockReset()
  })

  it('disables the rename-confirm button when the value is unchanged', async () => {
    const user = userEvent.setup()
    renderEditor()

    await waitFor(() => expect(screen.getByText('React')).toBeInTheDocument())
    await user.click(screen.getAllByText('Переименовать')[0])

    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('does not save when confirming a rename to the exact same value (the reported bug)', async () => {
    const user = userEvent.setup()
    renderEditor()

    await waitFor(() => expect(screen.getByText('React')).toBeInTheDocument())
    await user.click(screen.getAllByText('Переименовать')[0])

    const input = screen.getByDisplayValue('React')
    await user.type(input, '{Enter}')

    expect(saveFile).not.toHaveBeenCalled()
  })

  it('stages a rename to an actually different value without saving immediately', async () => {
    const user = userEvent.setup()
    renderEditor()

    await waitFor(() => expect(screen.getByText('React')).toBeInTheDocument())
    await user.click(screen.getAllByText('Переименовать')[0])

    const input = screen.getByDisplayValue('React')
    await user.clear(input)
    await user.type(input, 'React 19{Enter}')

    await waitFor(() => expect(screen.getByText('React 19')).toBeInTheDocument())
    expect(saveFile).not.toHaveBeenCalled()
  })
})

describe('TaxonomyEditor add term staging', () => {
  beforeEach(() => {
    storePat('test-token')
    vi.mocked(getFile).mockResolvedValue({
      data: { stack: ['React', 'Vue'], category: [], role: [] },
      sha: 'sha-taxonomies',
    })
    vi.mocked(listDir).mockResolvedValue([])
    vi.mocked(saveFile).mockResolvedValue(undefined)
  })

  afterEach(() => {
    clearPat()
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    vi.mocked(getFile).mockReset()
    vi.mocked(listDir).mockReset()
    vi.mocked(saveFile).mockReset()
  })

  it('stages a new term without saving immediately (the reported bug)', async () => {
    const user = userEvent.setup()
    renderEditor()

    await waitFor(() => expect(screen.getByText('React')).toBeInTheDocument())
    await user.type(screen.getByPlaceholderText('Новый термин'), 'Test{Enter}')

    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument())
    expect(saveFile).not.toHaveBeenCalled()
  })
})
