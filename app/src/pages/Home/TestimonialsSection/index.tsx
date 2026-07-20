import { useTranslation } from 'react-i18next'
import { CommandLabel } from '@/components/CommandLabel'
import type { Locale } from '@/lib/locale'
import { resolveLocalized } from '@/types'
import type { Testimonial } from '@/types'

export function TestimonialsSection({
  testimonials,
  locale,
}: {
  testimonials: Testimonial[]
  locale: Locale
}) {
  const { t } = useTranslation()
  console.debug('[refactor:home-testimonials]', { count: testimonials.length })

  return (
    <div className="flex flex-col gap-4">
      <CommandLabel label={t('home.testimonialsLabel')}>{t('home.testimonialsTitle')}</CommandLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="pixel-notch flex flex-col gap-2 border border-border p-4">
            <p className="text-sm text-muted-foreground">“{resolveLocalized(testimonial.quote, locale)}”</p>
            <p className="font-heading text-sm">
              {testimonial.name}
              {testimonial.role && <span className="text-muted-foreground"> · {testimonial.role}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
