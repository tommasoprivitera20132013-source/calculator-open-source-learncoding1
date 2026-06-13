'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  Brain, Image, Music, PenTool, Code, Video, BookOpen,
  CreditCard, HelpCircle, Network, FileText, Lightbulb,
  CheckSquare, Languages, TrendingUp, Zap, ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { User } from '@/types'

const quickActions = [
  { icon: Brain, name: 'AURA Brain', href: '/chat', desc: 'Start a conversation' },
  { icon: Image, name: 'AURA Vision', href: '/vision', desc: 'Generate an image' },
  { icon: Music, name: 'AURA Music', href: '/music', desc: 'Create music' },
  { icon: PenTool, name: 'AURA Write', href: '/write', desc: 'Write content' },
  { icon: Code, name: 'AURA Code', href: '/code', desc: 'Write or fix code' },
  { icon: BookOpen, name: 'AURA Notebook', href: '/notebook', desc: 'Take notes' },
  { icon: CreditCard, name: 'AURA Flashcards', href: '/flashcards', desc: 'Study flashcards' },
  { icon: HelpCircle, name: 'AURA Quiz', href: '/quiz', desc: 'Test yourself' },
  { icon: Network, name: 'AURA Mind Map', href: '/mindmap', desc: 'Map your ideas' },
  { icon: FileText, name: 'AURA PDF Chat', href: '/pdf-chat', desc: 'Chat with a PDF' },
  { icon: Lightbulb, name: 'AURA Explain', href: '/explain', desc: 'Understand anything' },
  { icon: CheckSquare, name: 'AURA Tasks', href: '/tasks', desc: 'Manage tasks' },
  { icon: Languages, name: 'AURA Translate', href: '/translate', desc: 'Translate text' },
  { icon: Video, name: 'AURA Video', href: '/video', desc: 'Generate video' },
]

interface UsageToday {
  count: number
  tool: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [usageToday, setUsageToday] = useState<UsageToday[]>([])
  const [totalRequests, setTotalRequests] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const [{ data: profile }, { data: usage }] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        supabase.from('usage').select('count, tool').eq('user_id', authUser.id).eq('date', new Date().toISOString().split('T')[0]),
      ])

      if (profile) setUser(profile as User)
      if (usage) {
        setUsageToday(usage as UsageToday[])
        setTotalRequests(usage.reduce((acc, u) => acc + u.count, 0))
      }
      setLoading(false)
    }
    load()
  }, [])

  const planLimits = { free: 10, pro: 500, ultra: Infinity }
  const limit = user ? planLimits[user.plan] : 10
  const usagePercent = limit === Infinity ? 0 : Math.min((totalRequests / limit) * 100, 100)

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-[#666] text-sm">Here&apos;s what&apos;s happening with your AURA workspace.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-4 h-4 text-[#999]" />
              <span className="text-xs text-[#666] uppercase tracking-wider">Requests today</span>
            </div>
            <div className="text-3xl font-bold">{loading ? '—' : totalRequests}</div>
            <div className="text-xs text-[#666] mt-1">of {limit === Infinity ? '∞' : limit} available</div>
            {limit !== Infinity && (
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${usagePercent}%` }} />
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-4 h-4 text-[#999]" />
              <span className="text-xs text-[#666] uppercase tracking-wider">Current plan</span>
            </div>
            <div className="text-3xl font-bold capitalize">{user?.plan ?? '—'}</div>
            <div className="text-xs text-[#666] mt-1">
              {user?.plan === 'free' ? 'Upgrade for more requests' : 'All features unlocked'}
            </div>
            {user?.plan === 'free' && (
              <Link href="/pricing" className="mt-3 inline-block text-xs text-white hover:underline">
                Upgrade →
              </Link>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-4 h-4 text-[#999]" />
              <span className="text-xs text-[#666] uppercase tracking-wider">Tools used today</span>
            </div>
            <div className="text-3xl font-bold">{loading ? '—' : usageToday.length}</div>
            <div className="text-xs text-[#666] mt-1">of 14 available tools</div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-[#666] uppercase tracking-wider mb-4">All Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link href={action.href} className="glass rounded-xl p-4 flex flex-col gap-2 hover:bg-white/5 transition-all group block">
                  <action.icon className="w-5 h-5 text-[#666] group-hover:text-white transition-colors" />
                  <div className="text-xs font-medium leading-tight">{action.name.replace('AURA ', '')}</div>
                  <div className="text-xs text-[#555] leading-tight hidden sm:block">{action.desc}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Upgrade banner for free users */}
        {user?.plan === 'free' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-semibold mb-1">Unlock the full AURA experience</h3>
              <p className="text-sm text-[#666]">Get 500 daily requests, all tools, and premium AI models with Pro.</p>
            </div>
            <Link
              href="/pricing"
              className="flex-shrink-0 flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all text-sm"
            >
              Upgrade to Pro <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
