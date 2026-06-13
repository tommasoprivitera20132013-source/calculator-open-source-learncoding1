'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Brain,
  Image,
  Music,
  PenTool,
  Code,
  Video,
  BookOpen,
  CreditCard,
  HelpCircle,
  Network,
  FileText,
  Lightbulb,
  CheckSquare,
  Languages,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { PlanBadge } from '@/components/ui/Badge'
import type { Plan } from '@/types'

// ─── Nav item types ────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

// ─── Nav structure ─────────────────────────────────────────────────────────────

const navGroups: NavGroup[] = [
  {
    title: 'Creative',
    items: [
      { label: 'AURA Brain',       href: '/chat',       icon: Brain },
      { label: 'AURA Vision',      href: '/vision',     icon: Image },
      { label: 'AURA Music',       href: '/music',      icon: Music },
      { label: 'AURA Write',       href: '/write',      icon: PenTool },
      { label: 'AURA Code',        href: '/code',       icon: Code },
      { label: 'AURA Video',       href: '/video',      icon: Video },
    ],
  },
  {
    title: 'Study',
    items: [
      { label: 'AURA Notebook',    href: '/notebook',   icon: BookOpen },
      { label: 'AURA Flashcards',  href: '/flashcards', icon: CreditCard },
      { label: 'AURA Quiz',        href: '/quiz',       icon: HelpCircle },
      { label: 'AURA Mind Map',    href: '/mindmap',    icon: Network },
      { label: 'AURA PDF Chat',    href: '/pdf-chat',   icon: FileText },
      { label: 'AURA Explain',     href: '/explain',    icon: Lightbulb },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { label: 'AURA Tasks',       href: '/tasks',      icon: CheckSquare },
      { label: 'AURA Translate',   href: '/translate',  icon: Languages },
    ],
  },
]

// ─── Single nav link ───────────────────────────────────────────────────────────

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150',
        active
          ? 'bg-white/10 text-white font-medium'
          : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
      )}
    >
      <Icon
        size={16}
        className={cn(
          'flex-shrink-0 transition-colors duration-150',
          active ? 'text-white' : 'text-white/40 group-hover:text-white/70'
        )}
      />
      <span className="truncate">{item.label}</span>
      {active && (
        <ChevronRight size={12} className="ml-auto flex-shrink-0 text-white/40" />
      )}
    </Link>
  )
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  /** Controlled open state for mobile sheet usage */
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [userPlan, setUserPlan] = useState<Plan>('free')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  // Fetch user plan on mount
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email ?? null)

      const { data: profile } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single()

      if (profile?.plan) setUserPlan(profile.plan as Plan)
    }
    fetchUser()
  }, [supabase])

  // Close mobile nav on route change
  useEffect(() => {
    onMobileClose?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'flex flex-col w-64 h-full bg-[#0a0a0a] border-r border-white/[0.06]',
        'overflow-hidden'
      )}
    >
      {/* ── Logo ── */}
      <div className="flex-shrink-0 flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-black" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white select-none">
          AURA
        </span>
      </div>

      {/* ── Scrollable nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Dashboard */}
        <div>
          <Link
            href="/dashboard"
            className={cn(
              'group flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150',
              isActive('/dashboard')
                ? 'bg-white/10 text-white font-medium'
                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
            )}
          >
            <LayoutDashboard
              size={16}
              className={cn(
                'flex-shrink-0 transition-colors duration-150',
                isActive('/dashboard')
                  ? 'text-white'
                  : 'text-white/40 group-hover:text-white/70'
              )}
            />
            <span>Dashboard</span>
            {isActive('/dashboard') && (
              <ChevronRight size={12} className="ml-auto flex-shrink-0 text-white/40" />
            )}
          </Link>
        </div>

        {/* Groups */}
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25 select-none">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom section ── */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-3 py-4 space-y-1">
        {/* User plan */}
        {userEmail && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/40 truncate">{userEmail}</p>
            </div>
            <PlanBadge plan={userPlan} />
          </div>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'group flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150',
            isActive('/settings')
              ? 'bg-white/10 text-white font-medium'
              : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
          )}
        >
          <Settings
            size={16}
            className={cn(
              'flex-shrink-0 transition-colors duration-150',
              isActive('/settings')
                ? 'text-white'
                : 'text-white/40 group-hover:text-white/70'
            )}
          />
          <span>Settings</span>
        </Link>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150',
            'text-white/50 hover:text-red-400 hover:bg-red-500/[0.08]',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <LogOut size={16} className="flex-shrink-0 text-white/40 group-hover:text-red-400 transition-colors duration-150" />
          <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
