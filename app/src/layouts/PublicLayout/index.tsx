import { Outlet } from 'react-router-dom'
import { Nav } from '@/shared/Nav'
import { Footer } from '@/shared/Footer'
import { Scanline } from '@/shared/Scanline'
import { Toaster } from '@/components/ui/sonner'

export function PublicLayout() {
  return (
    <div className="pixel-terminal flex min-h-svh flex-col bg-background text-foreground">
      <Scanline />
      <Nav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
