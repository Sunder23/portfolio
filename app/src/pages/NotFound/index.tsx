import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { useLocale } from '@/hooks/useLocale'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function NotFound() {
  const { t } = useTranslation()
  const locale = useLocale()

  useDocumentMeta({ title: t('notFound.title'), description: t('notFound.description') })

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="font-heading text-sm uppercase tracking-wide text-accent">404</p>
      <Heading level={1} className="font-heading text-3xl">
        {t('notFound.title')}
      </Heading>
      <p className="max-w-xl text-sm text-muted-foreground">{t('notFound.description')}</p>
      <Link
        to={`/${locale}`}
        className={buttonVariants({ variant: 'outline', className: 'inline-flex items-center gap-1.5' })}
      >
        <Home className="size-4 shrink-0" aria-hidden />
        {t('notFound.backHome')}
      </Link>
    </div>
  )
}
