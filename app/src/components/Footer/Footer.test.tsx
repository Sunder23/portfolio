import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Footer } from '@/components/Footer'
import { getProfile } from '@/lib/data'
import type { Profile } from '@/types'

vi.mock('@/lib/data', () => ({
  getProfile: vi.fn(),
}))

const PROFILE: Profile = {
  name: 'Max Kravchuk',
  title: { uk: 'WordPress розробник', ru: 'WordPress разработчик', en: 'WordPress developer' },
  bio: { uk: '', ru: '', en: '' },
  location: 'Odesa',
  email: 'kravchukmax85@gmail.com',
  socials: [{ platform: 'GitHub', url: 'https://github.com/Sunder23' }],
  avatar: '',
}

describe('Footer', () => {
  it('renders the email and social links from the resolved profile', async () => {
    vi.mocked(getProfile).mockResolvedValue(PROFILE)

    render(<Footer />)

    expect(await screen.findByRole('link', { name: 'kravchukmax85@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:kravchukmax85@gmail.com',
    )
    expect(screen.getByRole('link', { name: 'github' })).toHaveAttribute(
      'href',
      'https://github.com/Sunder23',
    )
    expect(screen.getByText(/Odesa/)).toBeInTheDocument()
  })
})
