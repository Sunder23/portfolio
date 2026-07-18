import { Outlet } from 'react-router-dom'
import { Nav } from '@/components/Nav'
import { Toaster } from '@/components/ui/sonner'

export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Nav />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
