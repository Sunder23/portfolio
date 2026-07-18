import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminAuth } from '@/admin/AdminAuthContext'
import { useAdminLocale } from '@/admin/AdminLocaleContext'
import { validateToken } from '@/admin/github'
import TokenGate from '@/admin/TokenGate'
import { navConfig } from '@/admin/navConfig'
import { SUPPORTED_LOCALES, getStoredLocale, DEFAULT_LOCALE } from '@/lib/locale'
import { cn } from '@/lib/utils'

function isActivePath(pathname: string, target: string): boolean {
  return pathname === target || pathname.startsWith(`${target}/`)
}

export default function AdminLayout() {
  const { token, logout } = useAdminAuth()
  const { locale, setLocale } = useAdminLocale()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    if (!token) {
      setChecking(false)
      setValid(false)
      return
    }

    let cancelled = false
    setChecking(true)

    validateToken(token)
      .then((ok) => {
        if (cancelled) return
        setValid(ok)
        if (!ok) {
          console.warn('[admin/AdminLayout] stored token is no longer valid, logging out')
          logout()
        }
      })
      .catch((err) => {
        if (cancelled) return
        // fetch() throwing (offline, blocked request, DNS) means we couldn't reach GitHub at
        // all — it says nothing about whether the stored token is actually valid. Treating it
        // the same as a definitive 401 forces a working session back to TokenGate on every
        // transient network hiccup. Only a real 401 (handled in .then above and in
        // useAdminSave.ts) should log the user out.
        console.error('[FIX:admin-session-network-error] could not verify stored token (network error), keeping existing session', err)
        setValid(true)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, logout])

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
        <nav className="flex w-56 shrink-0 flex-col gap-0.5 border-r bg-neutral-900 p-2 text-neutral-100">
          {navConfig.map((item) => {
            const Icon = item.icon
            const active = isActivePath(location.pathname, item.path)

            if (!item.children) {
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-neutral-800',
                    active && 'bg-neutral-800 font-medium',
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            }

            const groupActive = item.children.some((child) => isActivePath(location.pathname, child.path))

            return (
              <Collapsible key={item.id} defaultOpen={groupActive}>
                <CollapsibleTrigger
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-neutral-800',
                    groupActive && 'font-medium',
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                  <ChevronDown className="ml-auto size-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-0.5 py-1 pl-6">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={cn(
                        'rounded-lg px-2.5 py-1.5 text-sm hover:bg-neutral-800',
                        isActivePath(location.pathname, child.path) && 'bg-neutral-800 font-medium',
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </nav>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
