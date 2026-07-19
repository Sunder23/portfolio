import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getProfile } from '@/lib/data'
import { useAsyncData } from '@/hooks/useAsyncData'

export function Footer() {
  const { t } = useTranslation()
  const profile = useAsyncData(getProfile)

  useEffect(() => {
    if (profile) {
      console.debug('[Footer] profile loaded', { hasSocials: profile.socials.length > 0 })
    }
  }, [profile])

  if (!profile) {
    return null
  }

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-4xl flex-col gap-1 px-4 py-6 font-sans text-sm text-muted-foreground">
        <p>
          <span aria-hidden>{'> '}</span>
          {t('footer.status')}
        </p>
        <p>
          <span aria-hidden>{'> '}</span>
          {t('footer.location')}: {profile.location}
        </p>
        <p>
          <span aria-hidden>{'> '}</span>
          <a href={`mailto:${profile.email}`} className="hover:text-foreground hover:underline">
            {profile.email}
          </a>
        </p>
        {profile.socials.map((social) => (
          <p key={social.platform}>
            <span aria-hidden>{'> '}</span>
            <a
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground hover:underline"
            >
              {social.platform.toLowerCase()}
            </a>
          </p>
        ))}
      </div>
    </footer>
  )
}
