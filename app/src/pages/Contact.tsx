import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export default function Contact() {
  const { t } = useTranslation()

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

  function onSubmit(data: ContactFormValues) {
    console.info('[pages/Contact] submit (stub, no backend yet)', data)
    toast.success(t('contact.successTitle'), {
      description: t('contact.successDescription'),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">{t('contact.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('contact.description')}</p>
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
                <FormLabel>{t('contact.name')}</FormLabel>
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
                <FormLabel>{t('contact.email')}</FormLabel>
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
                <FormLabel>{t('contact.message')}</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder={t('contact.messagePlaceholder')} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="self-start">
            {t('contact.submit')}
          </Button>
        </form>
      </Form>
    </div>
  )
}
