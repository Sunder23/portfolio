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
        'font-heading text-sm font-normal uppercase tracking-wide text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden>$ </span>
      {children}
    </Component>
  )
}
