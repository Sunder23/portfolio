import { useTranslation } from 'react-i18next'
import { CommandLabel } from '@/components/CommandLabel'

export function StatsSection({ stats }: { stats: { label: string; value: string }[] }) {
  const { t } = useTranslation()
  console.debug('[refactor:home-stats]', { statsCount: stats.length })

  return (
    <div className="flex flex-col gap-4">
      <CommandLabel label={t('home.whoamiLabel')}>{t('home.whoamiTitle')}</CommandLabel>
      <div className="pixel-notch grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 bg-card px-4 py-3">
            <p className="font-heading text-2xl text-accent">{stat.value}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
