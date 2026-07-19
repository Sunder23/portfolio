import { useEffect, useState } from 'react'

export function Scanline() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(query.matches)
    console.debug('[Scanline] reduced motion:', query.matches)
  }, [])

  return (
    <div
      aria-hidden
      className="scanline-overlay pointer-events-none fixed inset-0 z-50 text-foreground"
      style={prefersReducedMotion ? { animation: 'none' } : undefined}
    />
  )
}
