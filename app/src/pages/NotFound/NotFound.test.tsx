import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import '@/lib/i18n'
import NotFound from '@/pages/NotFound'
import { LocaleProvider } from '@/hooks/useLocale'

describe('NotFound', () => {
  it('renders the not-found title and a link back to the locale home', () => {
    render(
      <MemoryRouter>
        <LocaleProvider value="uk">
          <NotFound />
        </LocaleProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Сторінку не знайдено' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'На головну' })).toHaveAttribute('href', '/uk')
  })
})
