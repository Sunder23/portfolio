import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function CommandLabel({
  as: Component = 'h2',
  className,
  children,
}: {
  as?: ElementType
  className?: string
  children: ReactNode
}) {
  return (
    <Component
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
