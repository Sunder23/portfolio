import { useTranslation } from 'react-i18next'
import { CommandLabel } from '@/components/CommandLabel'
import { formatRelativeCommitDate } from '@/lib/commits'
import type { Locale } from '@/lib/locale'
import type { CommitActivityWeek, CommitSummary } from '@/types'
import { CommitActivityGrid } from './CommitActivityGrid'

export function CommitsSection({
  commits,
  commitActivity,
  locale,
}: {
  commits: CommitSummary[]
  commitActivity: CommitActivityWeek[] | null
  locale: Locale
}) {
  const { t } = useTranslation()
  console.debug('[refactor:home-commits]', { count: commits.length })

  return (
    <div className="flex flex-col gap-4">
      <CommandLabel label={t('home.commitsLabel')}>{t('home.commitsTitle')}</CommandLabel>
      {commitActivity && commitActivity.length > 0 && <CommitActivityGrid weeks={commitActivity} />}
      <div className="pixel-notch flex flex-col border border-border bg-card">
        {commits.map((commit) => (
          <div
            key={commit.shortSha}
            className="flex flex-col gap-1 border-b border-border px-4 py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-3"
          >
            <span className="font-heading text-xs text-accent">{commit.shortSha}</span>
            <span className="flex-1 text-sm text-card-foreground">{commit.message}</span>
            <span className="text-xs text-muted-foreground">{formatRelativeCommitDate(commit.date, locale)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
