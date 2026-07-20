import { useTranslation } from 'react-i18next'
import { CommandLabel } from '@/components/CommandLabel'

export function FaqSection({ faqItems }: { faqItems: { question: string; answer: string }[] }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <CommandLabel label={t('home.faqLabel')}>{t('home.faqTitle')}</CommandLabel>
      <div className="flex flex-col gap-3">
        {faqItems.map((item) => (
          <div key={item.question} className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{item.question}</p>
            <p className="text-sm text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
