import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function CommandLabel({
  as: Component = 'h2',
  className,
  label,
  children,
}: {
  as?: ElementType
  className?: string
  /** Accessible name override — announced by screen readers instead of the stylized command text. */
  label?: string
  children: ReactNode
}) {
  return (
    <Component
      aria-label={label}
      className={cn(
        'font-heading text-lg font-normal uppercase tracking-wide text-foreground',
        className,
      )}
    >
      <span aria-hidden className="text-accent">$ </span>
      {children}
    </Component>
  )
}
