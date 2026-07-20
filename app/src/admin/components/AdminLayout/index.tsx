import { Outlet } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminAuth } from '@/admin/components/AdminAuthContext'
import { AdminDraftProvider } from '@/admin/components/AdminDraftContext'
import { useAdminLocale } from '@/admin/components/AdminLocaleContext'
import { useSessionCheck } from '@/admin/hooks/useSessionCheck'
import TokenGate from '@/admin/components/TokenGate'
import { AdminSidebar } from '@/admin/components/AdminSidebar'
import { SaveAllButton } from '@/admin/components/SaveAllButton'
import { SUPPORTED_LOCALES, getStoredLocale, DEFAULT_LOCALE } from '@/lib/locale'

export default function AdminLayout() {
  const { token, logout } = useAdminAuth()
  const { locale, setLocale } = useAdminLocale()
  const { checking, valid } = useSessionCheck(token, logout)

  if (checking) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Проверка сессии…</p>
      </div>
    )
  }

  if (!token || !valid) {
    return (
      <>
        <TokenGate />
        <Toaster />
      </>
    )
  }

  const siteHref = `/#/${getStoredLocale() ?? DEFAULT_LOCALE}`

  return (
    // Wraps the whole authenticated shell (not just <Outlet/>) so both the routed editors
    // and the floating <SaveAllButton/> (a sibling of <main>) share the same staging store.
    // AdminLayout itself never remounts on route changes, so the draft survives navigating
    // between editors either way — this is about sibling access, not persistence.
    <AdminDraftProvider>
      <div className="flex min-h-svh flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b bg-neutral-900 px-3 text-neutral-100">
          <a href={siteHref} className="text-sm font-medium hover:underline">
            ← На сайт
          </a>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="text-neutral-100 hover:bg-neutral-800 hover:text-neutral-100" />
                }
              >
                {locale.toUpperCase()}
                <ChevronDown data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SUPPORTED_LOCALES.map((item) => (
                  <DropdownMenuItem key={item} onClick={() => setLocale(item)}>
                    {item.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-100 hover:bg-neutral-800 hover:text-neutral-100"
              onClick={logout}
            >
              <LogOut data-icon="inline-start" />
              Выйти
            </Button>
          </div>
        </header>

        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
        <SaveAllButton />
        <Toaster />
      </div>
    </AdminDraftProvider>
  )
}
