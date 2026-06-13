'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Brain, Image, Music, PenTool, Code, Video, BookOpen, CreditCard,
  HelpCircle, Network, FileText, Lightbulb, CheckSquare, Languages,
  ArrowRight, Zap, Shield, Star, Check
} from 'lucide-react'

const features = [
  { icon: Brain, name: 'AURA Brain', desc: 'Real-time AI chat with streaming responses and persistent history' },
  { icon: Image, name: 'AURA Vision', desc: 'Generate stunning images in any style — Realistic, Anime, Cinematic and more' },
  { icon: Music, name: 'AURA Music', desc: 'Create original music from mood, genre and BPM — download as MP3' },
  { icon: PenTool, name: 'AURA Write', desc: 'Generate lyrics, essays, scripts, emails and more in 5 languages' },
  { icon: Code, name: 'AURA Code', desc: 'Generate, explain, fix and optimize code in 8 programming languages' },
  { icon: Video, name: 'AURA Video', desc: 'Text-to-video and image-to-video generation powered by Runway ML' },
  { icon: BookOpen, name: 'AURA Notebook', desc: 'AI-powered rich text editor with inline commands and folder organization' },
  { icon: CreditCard, name: 'AURA Flashcards', desc: 'Upload PDFs and auto-generate flashcards with spaced repetition' },
  { icon: HelpCircle, name: 'AURA Quiz', desc: 'AI-generated quizzes with score tracking and detailed explanations' },
  { icon: Network, name: 'AURA Mind Map', desc: 'Generate interactive mind maps with drag & drop — export as PNG' },
  { icon: FileText, name: 'AURA PDF Chat', desc: 'Upload any PDF and chat with it — ask questions, get summaries' },
  { icon: Lightbulb, name: 'AURA Explain', desc: 'Understand any concept at Child, Student or Expert level' },
  { icon: CheckSquare, name: 'AURA Tasks', desc: 'Kanban board with AI task generation from project descriptions' },
  { icon: Languages, name: 'AURA Translate', desc: 'Translate between 30+ languages with formal/casual tone control' },
]

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: '',
    desc: 'Get started with the basics',
    features: ['10 AI requests/day', 'AURA Brain Base', 'AURA Vision Base', 'Basic tools'],
    cta: 'Start for free',
    href: '/auth/signup',
    featured: false,
  },
  {
    name: 'Pro',
    price: '€9.99',
    period: '/month',
    desc: 'Everything you need to create',
    features: ['500 AI requests/day', 'AURA Brain Pro', 'AURA Vision Pro (FLUX 1.1)', 'All tools unlocked', 'Priority support'],
    cta: 'Get Pro',
    href: '/pricing',
    featured: true,
  },
  {
    name: 'Ultra',
    price: '€29.99',
    period: '/month',
    desc: 'Maximum power, no limits',
    features: ['Unlimited AI requests', 'AURA Brain Ultra (Opus 4)', 'AURA Vision Ultra (FLUX Pro)', 'All tools + AURA Video', 'Priority speed', 'Early access to new features'],
    cta: 'Get Ultra',
    href: '/pricing',
    featured: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#0a0a0a]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">AURA</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#999]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-[#999] hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup" className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/90 transition-all">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs text-[#999] mb-8">
              <Zap className="w-3 h-3" />
              The most powerful AI in the world
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Create anything.<br />
              <span className="text-[#666]">Powered by AURA.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#666] max-w-2xl mx-auto mb-10 leading-relaxed">
              A premium AI creative studio, study tool, and productivity app — all in one platform.
              Generate images, music, code, and more with state-of-the-art AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup" className="flex items-center gap-2 bg-white text-black font-semibold px-8 py-4 rounded-full hover:bg-white/90 transition-all text-sm">
                Start for free <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="text-sm text-[#999] hover:text-white transition-colors">
                Explore features
              </a>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-8 mt-16 text-center"
          >
            {[{ value: '14+', label: 'AI Tools' }, { value: '3', label: 'Model Tiers' }, { value: '30+', label: 'Languages' }, { value: '8', label: 'Code Languages' }].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-[#666]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to create</h2>
            <p className="text-[#666] text-lg">14 AI-powered tools in one premium platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }} viewport={{ once: true }}
                className="glass rounded-2xl p-6 hover:bg-white/5 transition-all"
              >
                <feature.icon className="w-6 h-6 mb-4 text-white" />
                <h3 className="font-semibold mb-2 text-sm">{feature.name}</h3>
                <p className="text-[#666] text-xs leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AURA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for creators and learners</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Lightning fast', desc: 'Real-time streaming responses. No waiting. AURA is always instant.' },
              { icon: Shield, title: 'Privacy first', desc: 'Your data is encrypted and never used to train AI models.' },
              { icon: Star, title: 'Premium quality', desc: 'Top-tier models — Claude Opus 4, FLUX 1.1 Pro, and Runway ML.' },
            ].map(item => (
              <div key={item.title} className="glass rounded-2xl p-8 text-center">
                <item.icon className="w-8 h-8 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-[#666]">Start free, upgrade when you&apos;re ready</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`rounded-2xl p-8 relative ${plan.featured ? 'bg-white text-black' : 'glass'}`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <div className={`text-sm font-medium mb-1 ${plan.featured ? 'text-black/60' : 'text-[#666]'}`}>{plan.name}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className={`text-sm mb-1 ${plan.featured ? 'text-black/60' : 'text-[#666]'}`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm mt-1 ${plan.featured ? 'text-black/60' : 'text-[#666]'}`}>{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.featured ? 'text-black' : 'text-white'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${plan.featured ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-black hover:bg-white/90'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to create with AURA?</h2>
          <p className="text-[#666] mb-8">Join thousands of creators, students, and professionals using AURA.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-white text-black font-semibold px-8 py-4 rounded-full hover:bg-white/90 transition-all text-sm">
            Get started for free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold">AURA</span>
          <p className="text-[#666] text-xs">© 2025 AURA. The most powerful AI in the world.</p>
          <div className="flex gap-6 text-xs text-[#666]">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
