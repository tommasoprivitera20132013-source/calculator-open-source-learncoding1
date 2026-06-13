'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: '',
    desc: 'Perfect to get started',
    features: [
      '10 AI requests/day',
      'AURA Brain Base',
      'AURA Vision Base (SD XL)',
      'Basic tools access',
      'Community support',
    ],
    notIncluded: ['AURA Music', 'AURA Video', 'Advanced models', 'Priority speed'],
    cta: 'Get started free',
    href: '/auth/signup',
    featured: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€9.99',
    period: '/month',
    desc: 'For creators and students',
    features: [
      '500 AI requests/day',
      'AURA Brain Pro (Claude Sonnet)',
      'AURA Vision Pro (FLUX 1.1)',
      'All tools unlocked',
      'AURA Music generation',
      'Priority support',
    ],
    notIncluded: ['AURA Video', 'Opus 4 model'],
    cta: 'Get Pro',
    href: null,
    planId: 'pro',
    featured: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: '€29.99',
    period: '/month',
    desc: 'For power users and teams',
    features: [
      'Unlimited AI requests',
      'AURA Brain Ultra (Claude Opus 4)',
      'AURA Vision Ultra (FLUX 1.1 Pro)',
      'All tools including AURA Video',
      'Priority speed',
      'Early access to new features',
      'Dedicated support',
    ],
    notIncluded: [],
    cta: 'Get Ultra',
    href: null,
    planId: 'ultra',
    featured: false,
  },
]

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planId: 'pro' | 'ultra') => {
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/pricing'
        return
      }

      const { url, error } = await res.json()
      if (error) { toast.error(error); return }
      if (url) window.location.href = url
    } catch {
      toast.error('Failed to start checkout')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[#999] hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <span className="font-bold">AURA</span>
        <Link href="/auth/login" className="text-sm text-[#999] hover:text-white transition-colors">Sign in</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-[#666] text-lg">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-8 relative flex flex-col ${plan.featured ? 'bg-white text-black' : 'glass'}`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${plan.featured ? 'text-black/50' : 'text-[#666]'}`}>
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.featured ? 'text-black/50' : 'text-[#666]'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm ${plan.featured ? 'text-black/60' : 'text-[#666]'}`}>{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.featured ? 'text-black' : 'text-white'}`} />
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} className={`flex items-start gap-3 text-sm line-through ${plan.featured ? 'text-black/30' : 'text-[#444]'}`}>
                    <span className="w-4 flex-shrink-0 mt-0.5 text-center">×</span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.href ? (
                <Link
                  href={plan.href}
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${plan.featured ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-black hover:bg-white/90'}`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.planId as 'pro' | 'ultra')}
                  disabled={!!loadingPlan}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-70 ${plan.featured ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-black hover:bg-white/90'}`}
                >
                  {loadingPlan === plan.planId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {plan.cta}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-[#555] mt-8">
          All prices in EUR. Subscriptions auto-renew monthly. Cancel anytime from your account settings.
        </p>
      </div>
    </div>
  )
}
