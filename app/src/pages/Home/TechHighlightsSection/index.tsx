import { useTranslation } from 'react-i18next'
import { CommandLabel } from '@/components/CommandLabel'

export function TechHighlightsSection({ techHighlights }: { techHighlights: string[] }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <CommandLabel label={t('home.techLabel')}>{t('home.techTitle')}</CommandLabel>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {techHighlights.map((tech) => (
          <div
            key={tech}
            className="pixel-notch flex flex-col items-center justify-center gap-1 border border-border bg-card px-2 py-4 text-center"
          >
            <span aria-hidden className="font-heading text-lg text-accent">
              {tech.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[11px] text-muted-foreground">{tech}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
