import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAuthProvider } from '@/admin/context/AdminAuthContext'
import { AdminDraftProvider } from '@/admin/context/AdminDraftContext'
import { AdminLocaleProvider } from '@/admin/context/AdminLocaleContext'
import { SaveAllButton } from '@/admin/components/AdminLayout/SaveAllButton'
import { storePat, clearPat } from '@/admin/lib/pat'
import { ProjectsList } from '@/admin/editors/ProjectsList'
import { emptyProject } from '@/admin/editors/projectsData'
import type { Project } from '@/types'

vi.mock('@/admin/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/admin/lib/github')>()
  return {
    ...actual,
    getFile: vi.fn(),
    listDir: vi.fn(),
    deleteFile: vi.fn(),
  }
})

import { getFile, listDir, deleteFile } from '@/admin/lib/github'

const DRAFT_STORAGE_KEY = 'admin-draft-v1'

const project: Project = { ...emptyProject(), title: { uk: 'Мій проєкт' }, slug: 'my-project' }

function renderList() {
  return render(
    <AdminAuthProvider>
      <AdminLocaleProvider>
        <AdminDraftProvider>
          <MemoryRouter>
            <ProjectsList />
            <SaveAllButton />
          </MemoryRouter>
        </AdminDraftProvider>
      </AdminLocaleProvider>
    </AdminAuthProvider>,
  )
}

describe('ProjectsList delete staging', () => {
  beforeEach(() => {
    storePat('test-token')
    vi.mocked(listDir).mockResolvedValue([{ name: 'my-project.json', path: 'app/data/projects/my-project.json', sha: 'sha-list' }])
    vi.mocked(getFile).mockResolvedValue({ data: project, sha: 'sha-project' })
    vi.mocked(deleteFile).mockResolvedValue(undefined)
  })

  afterEach(() => {
    clearPat()
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    vi.mocked(getFile).mockReset()
    vi.mocked(listDir).mockReset()
    vi.mocked(deleteFile).mockReset()
  })

  // [FIX] Confirming delete used to call deleteFile() straight away, pushing a commit
  // immediately and never showing up on the "Save all" counter — see docs/admin-workflow.md.
  it('stages the delete (no immediate push) and only calls deleteFile once Save All is clicked', async () => {
    const user = userEvent.setup()
    renderList()

    await waitFor(() => expect(screen.getByText('Мій проєкт')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Удалить' }))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }))

    // Row disappears immediately (optimistic), but nothing was pushed to GitHub yet.
    expect(screen.queryByText('Мій проєкт')).not.toBeInTheDocument()
    expect(deleteFile).not.toHaveBeenCalled()
    expect(screen.getByText('Сохранить всё (1)')).toBeInTheDocument()

    await user.click(screen.getByText('Сохранить всё (1)'))

    await waitFor(() =>
      expect(deleteFile).toHaveBeenCalledWith(
        'app/data/projects/my-project.json',
        'sha-project',
        expect.stringContaining('my-project'),
        'test-token',
      ),
    )
    await waitFor(() => expect(screen.queryByText(/Сохранить всё/)).not.toBeInTheDocument())
  })
})
