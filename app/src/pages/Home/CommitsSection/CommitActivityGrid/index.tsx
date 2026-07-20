import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { CommitActivityWeek } from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000

const LEVEL_CLASSES = ['', 'bg-accent/15', 'bg-accent/40', 'bg-accent/70', 'bg-accent']

function levelForCount(count: number, max: number): number {
  if (count === 0) return 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export function CommitActivityGrid({ weeks }: { weeks: CommitActivityWeek[] }) {
  const { t } = useTranslation()
  const max = Math.max(1, ...weeks.flatMap((week) => week.days))

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto" role="img" aria-label={t('home.commitsActivityAriaLabel')}>
        <div className="grid w-max auto-cols-min grid-flow-col grid-rows-7 gap-1">
          {weeks.map((week) =>
            week.days.map((count, dayIndex) => {
              const date = new Date(new Date(week.weekStart).getTime() + dayIndex * DAY_MS)
              const level = levelForCount(count, max)
              return (
                <span
                  key={`${week.weekStart}-${dayIndex}`}
                  aria-hidden
                  title={`${date.toISOString().slice(0, 10)}: ${count} commit${count === 1 ? '' : 's'}`}
                  className={cn('size-2.5 border border-border', LEVEL_CLASSES[level])}
                />
              )
            }),
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>{t('home.commitsLess')}</span>
        {LEVEL_CLASSES.map((levelClass, level) => (
          <span key={level} aria-hidden className={cn('size-2.5 border border-border', levelClass)} />
        ))}
        <span>{t('home.commitsMore')}</span>
      </div>
    </div>
  )
}
