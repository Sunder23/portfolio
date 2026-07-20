import { useTranslation } from 'react-i18next'
import { CommandLabel } from '@/components/CommandLabel'
import { stepNumber } from '@/pages/Home/constants'

export function ProcessSection({
  processSteps,
}: {
  processSteps: { title: string; description: string }[]
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <CommandLabel label={t('home.processLabel')}>{t('home.processTitle')}</CommandLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {processSteps.map((step, index) => (
          <div key={step.title} className="pixel-notch flex flex-col gap-1.5 border border-border p-4">
            <p aria-hidden className="font-heading text-xs text-accent">
              {stepNumber(index)} →
            </p>
            <p className="font-heading text-base">{step.title}</p>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
