import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { getProfile, getSkills } from '@/lib/data'
import { useLocalized } from '@/hooks/useLocalized'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/lib/useDocumentMeta'

export default function About() {
  const { t } = useTranslation()
  const profile = useAsyncData(getProfile, 'About')
  const skills = useAsyncData(getSkills, 'About')

  const bio = useLocalized(profile?.bio ?? { uk: '' })

  useDocumentMeta({ title: t('meta.about.title'), description: t('meta.about.description') })

  if (!profile || !skills) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">{t('about.title')}</h1>

      <p className="max-w-xl text-sm text-muted-foreground">{bio}</p>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t('about.skills')}</h2>
        {skills.map((cat) => (
          <div key={cat.category} className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">{cat.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{t('about.contact')}</h2>
        <a
          href={`mailto:${profile.email}`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {profile.email}
        </a>
        {profile.socials.map((social) => (
          <a
            key={social.platform}
            href={social.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {social.platform}
          </a>
        ))}
      </div>
    </div>
  )
}
