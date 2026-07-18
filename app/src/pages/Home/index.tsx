import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { getProfile } from '@/lib/data'
import { useLocale } from '@/hooks/useLocale'
import { useLocalized } from '@/hooks/useLocalized'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function Home() {
  const { t } = useTranslation()
  const locale = useLocale()
  const profile = useAsyncData(getProfile)

  const title = useLocalized(profile?.title ?? { uk: '' })
  const bio = useLocalized(profile?.bio ?? { uk: '' })

  useDocumentMeta({ title: t('meta.home.title'), description: t('meta.home.description') })

  if (!profile) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-4">
      <h1 className="text-3xl font-medium">{profile.name}</h1>
      <p className="text-lg text-muted-foreground">{title}</p>
      <p className="max-w-xl text-sm text-muted-foreground">{bio}</p>
      <div className="flex gap-2">
        <Link to={`/${locale}/projects`} className={buttonVariants({ variant: 'default' })}>
          {t('home.viewProjects')}
        </Link>
        <Link to={`/${locale}/about`} className={buttonVariants({ variant: 'outline' })}>
          {t('home.viewAbout')}
        </Link>
        <a href={`mailto:${profile.email}`} className={buttonVariants({ variant: 'ghost' })}>
          {t('home.contactMe')}
        </a>
      </div>
    </div>
  )
}
