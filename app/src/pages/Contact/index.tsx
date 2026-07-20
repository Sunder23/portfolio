import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Mail, Send, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CommandLabel } from '@/components/CommandLabel'
import { getProfile } from '@/lib/data'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

function BracketLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel className="font-heading text-xs uppercase tracking-wide">
      <span aria-hidden>[ </span>
      {children}
      <span aria-hidden> ]</span>
    </FormLabel>
  )
}

export default function Contact() {
  const { t } = useTranslation()
  const profile = useAsyncData(getProfile)

  useDocumentMeta({ title: t('meta.contact.title'), description: t('meta.contact.description') })

  const faqItems = t('contact.faq.items', { returnObjects: true }) as { question: string; answer: string }[]

  // Rebuilt on locale change so zod issue messages stay localized.
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t('contact.nameError')),
        email: z.string().email(t('contact.emailError')),
        message: z.string().min(10, t('contact.messageError')),
        // Honeypot: must stay empty. No real anti-spam yet — just markup for
        // when the Apps Script relay lands (see DESCRIPTION.md).
        company: z.string().max(0).optional(),
      }),
    [t],
  )

  type ContactFormValues = z.infer<typeof schema>

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', message: '', company: '' },
  })

  function onSubmit(_data: ContactFormValues) {
    toast.success(t('contact.successTitle'), {
      description: t('contact.successDescription'),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <CommandLabel as="h1" className="text-2xl" label={t('contact.title')}>
          {t('contact.commandTitle')}
        </CommandLabel>
        <p className="text-sm text-muted-foreground">{t('contact.description')}</p>
      </div>

      {profile && (
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{t('footer.status')}</Badge>
          <a
            href={`mailto:${profile.email}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            <Mail className="size-3.5 shrink-0" aria-hidden />
            {profile.email}
          </a>
          {profile.socials.map((social) => {
            const isTelegram = social.platform.toLowerCase() === 'telegram'
            const SocialIcon = isTelegram ? Send : LinkIcon
            return (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                <SocialIcon className="size-3.5 shrink-0" aria-hidden />
                {social.platform.toLowerCase()}
              </a>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <CommandLabel label={t('contact.faq.label')}>{t('contact.faq.title')}</CommandLabel>
        <div className="flex flex-col gap-3">
          {faqItems.map((item) => (
            <div key={item.question} className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{item.question}</p>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-4">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem className="sr-only" aria-hidden>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} tabIndex={-1} autoComplete="off" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <BracketLabel>{t('contact.name')}</BracketLabel>
                <FormControl>
                  <Input {...field} placeholder={t('contact.namePlaceholder')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <BracketLabel>{t('contact.email')}</BracketLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder={t('contact.emailPlaceholder')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <BracketLabel>{t('contact.message')}</BracketLabel>
                <FormControl>
                  <Textarea {...field} placeholder={t('contact.messagePlaceholder')} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="font-heading inline-flex items-center gap-1.5 self-start uppercase tracking-wide">
            <span aria-hidden>$ </span>
            <Send className="size-4 shrink-0" aria-hidden />
            {t('contact.submit')}
          </Button>
        </form>
      </Form>
    </div>
  )
}
