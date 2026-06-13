'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { User as UserIcon, CreditCard, BarChart2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { User } from '@/types'

const PLAN_DETAILS = {
  free: { label: 'Free', requests: '10/day', color: 'text-[#999]' },
  pro: { label: 'Pro', requests: '500/day', color: 'text-blue-400' },
  ultra: { label: 'Ultra', requests: 'Unlimited', color: 'text-purple-400' },
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [usageStats, setUsageStats] = useState<{ tool: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const [{ data: profile }, { data: usage }] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        supabase.from('usage').select('tool, count').eq('user_id', authUser.id).order('count', { ascending: false }).limit(10),
      ])

      if (profile) {
        setUser(profile as User)
        setName(profile.name ?? '')
      }
      if (usage) setUsageStats(usage as { tool: string; count: number }[])
      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('users').update({ name }).eq('id', user.id)
    if (error) toast.error('Failed to save')
    else toast.success('Profile updated')
    setSaving(false)
  }

  const openBillingPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) { toast.error(error); return }
      if (url) window.location.href = url
    } catch {
      toast.error('Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
        </div>
      </DashboardLayout>
    )
  }

  const planInfo = user ? PLAN_DETAILS[user.plan] : PLAN_DETAILS.free

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-[#666] text-sm mb-8">Manage your profile and subscription</p>

          {/* Profile */}
          <section className="glass rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="w-4 h-4 text-[#666]" />
              <h2 className="font-semibold">Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#999] mb-2">Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-[#999] mb-2">Email</label>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#666]">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-white text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save changes
              </button>
            </div>
          </section>

          {/* Billing */}
          <section className="glass rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-4 h-4 text-[#666]" />
              <h2 className="font-semibold">Billing</h2>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize">{user?.plan} Plan</span>
                  <span className={`text-xs ${planInfo.color}`}>• {planInfo.requests}</span>
                </div>
                <p className="text-sm text-[#666] mt-1">
                  {user?.plan === 'free' ? 'No active subscription' : 'Active subscription'}
                </p>
              </div>
              {user?.plan === 'free' ? (
                <a
                  href="/pricing"
                  className="bg-white text-black font-semibold px-5 py-2 rounded-xl hover:bg-white/90 transition-all text-sm"
                >
                  Upgrade
                </a>
              ) : (
                <button
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                  className="flex items-center gap-2 border border-white/20 text-white font-medium px-5 py-2 rounded-xl hover:bg-white/5 transition-all text-sm disabled:opacity-50"
                >
                  {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Manage billing
                </button>
              )}
            </div>
          </section>

          {/* Usage */}
          <section className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart2 className="w-4 h-4 text-[#666]" />
              <h2 className="font-semibold">Usage (All Time)</h2>
            </div>

            {usageStats.length === 0 ? (
              <p className="text-sm text-[#555]">No usage data yet.</p>
            ) : (
              <div className="space-y-3">
                {usageStats.map(stat => (
                  <div key={stat.tool} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-[#999]">{stat.tool}</span>
                    <span className="text-sm font-medium">{stat.count} requests</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
