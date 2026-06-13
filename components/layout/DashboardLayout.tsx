'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'

interface DashboardLayoutProps {
  children: React.ReactNode
  /** Extra class applied to the main content area */
  className?: string
}

const sidebarOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.15 } },
}

const sidebarPanelVariants = {
  hidden:  { x: '-100%' },
  visible: { x: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
  exit:    { x: '-100%', transition: { duration: 0.2, ease: 'easeIn' as const } },
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const router = useRouter()
  const supabase = createClient()

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Auth guard — redirect to /login if not authenticated
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setAuthChecked(true)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace('/login')
      }
    )
    return () => subscription.unsubscribe()
  }, [router, supabase])

  // Close mobile nav on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [mobileNavOpen])

  // Render nothing while auth check is in progress to prevent flash
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {/* ── Desktop Sidebar (always visible ≥ md) ── */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              variants={sidebarOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />

            {/* Sliding panel */}
            <motion.div
              key="sidebar-panel"
              className="md:hidden fixed inset-y-0 left-0 z-50 w-64 shadow-2xl"
              variants={sidebarPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Close button inside drawer */}
              <button
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'absolute top-4 right-3 z-10 p-1.5 rounded-xl',
                  'text-white/50 hover:text-white hover:bg-white/10',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>

              <Sidebar
                mobileOpen={mobileNavOpen}
                onMobileClose={() => setMobileNavOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main column (header + scrollable content) ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileNavOpen(true)} />

        {/* Scrollable page content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            // Bottom padding for mobile bottom nav
            'pb-20 md:pb-0',
            className
          )}
        >
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <MobileNav />
    </div>
  )
}

export default DashboardLayout
