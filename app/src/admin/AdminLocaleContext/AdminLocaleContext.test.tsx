import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AdminLocaleProvider, useAdminLocale } from '@/admin/AdminLocaleContext'

function LocaleProbe() {
  const { locale, setLocale } = useAdminLocale()
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale('ru')}>switch to ru</button>
    </div>
  )
}

describe('AdminLocaleContext', () => {
  beforeEach(() => {
    window.localStorage.removeItem('portfolio-admin-locale')
  })

  afterEach(() => {
    window.localStorage.removeItem('portfolio-admin-locale')
  })

  it('defaults to uk when nothing is stored', () => {
    render(
      <AdminLocaleProvider>
        <LocaleProbe />
      </AdminLocaleProvider>,
    )

    expect(screen.getByTestId('locale')).toHaveTextContent('uk')
  })

  it('updates the context value and persists to localStorage on setLocale', async () => {
    const user = userEvent.setup()
    render(
      <AdminLocaleProvider>
        <LocaleProbe />
      </AdminLocaleProvider>,
    )

    await user.click(screen.getByText('switch to ru'))

    expect(screen.getByTestId('locale')).toHaveTextContent('ru')
    expect(window.localStorage.getItem('portfolio-admin-locale')).toBe('ru')
  })

  it('picks up a persisted locale on a fresh mount', () => {
    act(() => {
      window.localStorage.setItem('portfolio-admin-locale', 'en')
    })

    render(
      <AdminLocaleProvider>
        <LocaleProbe />
      </AdminLocaleProvider>,
    )

    expect(screen.getByTestId('locale')).toHaveTextContent('en')
  })
})
