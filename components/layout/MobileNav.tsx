'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Brain,
  Image,
  CheckSquare,
  BookOpen,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavItem {
  label: string
  href: string
  icon: LucideIcon
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: 'Home',       href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Brain',      href: '/chat',        icon: Brain },
  { label: 'Vision',     href: '/vision',      icon: Image },
  { label: 'Tasks',      href: '/tasks',       icon: CheckSquare },
  { label: 'Study',      href: '/notebook',    icon: BookOpen },
  { label: 'Settings',   href: '/settings',    icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-40',
        'bg-[#0a0a0a]/90 backdrop-blur-xl',
        'border-t border-white/[0.08]',
        // Safe area for devices with home indicator
        'pb-[env(safe-area-inset-bottom)]'
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl',
                'min-w-[52px] transition-all duration-150',
                active
                  ? 'text-white'
                  : 'text-white/35 hover:text-white/60'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={cn(
                  'relative p-1.5 rounded-xl transition-all duration-150',
                  active ? 'bg-white/10' : 'bg-transparent'
                )}
              >
                <Icon size={20} />
                {active && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium select-none transition-colors duration-150',
                  active ? 'text-white' : 'text-white/35'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileNav
