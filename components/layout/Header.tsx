'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import type { User } from '@/types'

// ─── Route title map ───────────────────────────────────────────────────────────

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/chat':       'AURA Brain',
  '/vision':     'AURA Vision',
  '/music':      'AURA Music',
  '/write':      'AURA Write',
  '/code':       'AURA Code',
  '/video':      'AURA Video',
  '/notebook':   'AURA Notebook',
  '/flashcards': 'AURA Flashcards',
  '/quiz':       'AURA Quiz',
  '/mindmap':    'AURA Mind Map',
  '/pdf-chat':   'AURA PDF Chat',
  '/explain':    'AURA Explain',
  '/tasks':      'AURA Tasks',
  '/translate':  'AURA Translate',
  '/settings':   'Settings',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  // Prefix match (e.g. /chat/abc → 'AURA Brain')
  const match = Object.keys(ROUTE_TITLES).find(
    (key) => key !== '/dashboard' && pathname.startsWith(key)
  )
  return match ? ROUTE_TITLES[match] : 'AURA'
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: User | null }) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  if (user?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt={user.name ?? 'Avatar'}
        className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
      />
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-white/80 select-none">{initials}</span>
    </div>
  )
}

// ─── Header ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const pageTitle = getPageTitle(pathname)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data) setUser(data as User)
    }
    fetchUser()
  }, [supabase])

  return (
    <header className="flex-shrink-0 flex items-center justify-between gap-4 h-14 px-4 md:px-6 border-b border-white/[0.06] bg-[#0a0a0a]">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className={cn(
            'md:hidden flex-shrink-0 p-2 rounded-xl text-white/50',
            'hover:text-white hover:bg-white/[0.06] transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
          )}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <h1 className="text-sm font-semibold text-white truncate">{pageTitle}</h1>
      </div>

      {/* Right: notification bell + avatar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          className={cn(
            'p-2 rounded-xl text-white/40',
            'hover:text-white/70 hover:bg-white/[0.06] transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
          )}
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        <Avatar user={user} />
      </div>
    </header>
  )
}

export default Header
