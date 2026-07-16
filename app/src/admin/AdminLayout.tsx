import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { useAdminAuth } from '@/admin/AdminAuthContext'
import { validateToken } from '@/admin/github'
import TokenGate from '@/admin/TokenGate'
import { editorRegistry } from '@/admin/registry'

export default function AdminLayout() {
  const { token, logout } = useAdminAuth()
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

  return (
    <div className="flex min-h-svh">
      <nav className="flex w-48 shrink-0 flex-col gap-1 border-r p-3">
        {editorRegistry.map((item) => (
          <Link key={item.id} to={`/admin/${item.id}`} className="rounded-lg px-2.5 py-1.5 text-sm hover:bg-muted">
            {item.label}
          </Link>
        ))}
        <Button variant="ghost" size="sm" className="mt-auto" onClick={logout}>
          Выйти
        </Button>
      </nav>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
