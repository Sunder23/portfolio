import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[18.4px] w-[32px]" aria-hidden="true" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="flex items-center gap-1.5">
      <Sun className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label={t('theme.toggleLabel')}
      />
      <Moon className="size-3.5 text-muted-foreground" aria-hidden="true" />
    </div>
  )
}
