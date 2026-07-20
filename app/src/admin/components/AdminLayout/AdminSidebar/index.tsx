import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { navConfig } from '@/admin/lib/navConfig'
import { cn } from '@/lib/utils'

function isActivePath(pathname: string, target: string): boolean {
  return pathname === target || pathname.startsWith(`${target}/`)
}

export function AdminSidebar() {
  const location = useLocation()
  console.debug('[refactor:admin-layout-children] AdminSidebar mounted')

  return (
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
  )
}
