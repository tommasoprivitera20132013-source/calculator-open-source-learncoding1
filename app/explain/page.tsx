'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Lightbulb, BookOpen, Loader2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { ExplainLevel } from '@/types'
import { createClient } from '@/lib/supabase'

const levels: { id: ExplainLevel; label: string; emoji: string; desc: string }[] = [
  { id: 'Child', label: 'Child', emoji: '🧒', desc: 'Age 10 — simple words, fun analogies' },
  { id: 'Student', label: 'Student', emoji: '📚', desc: 'High school/university level — clear & educational' },
  { id: 'Expert', label: 'Expert', emoji: '🔬', desc: 'Technical depth — advanced concepts & nuance' },
]

export default function ExplainPage() {
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState<ExplainLevel>('Student')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  const generate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to generate explanation')
        return
      }
      const { result: explanation } = await res.json()
      setResult(explanation)
    } catch {
      toast.error('Failed to generate explanation')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const saveToNotebook = async () => {
    if (!result) return
    setSavingNote(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Not authenticated'); return }
      await supabase.from('notes').insert({
        user_id: user.id,
        title: topic.slice(0, 60),
        content: `# ${topic}\n\n**Level: ${level}**\n\n${result}`,
      })
      toast.success('Saved to notebook!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">AURA Explain</h1>
          <p className="text-[#666] text-sm">Understand any concept at your level</p>
        </div>

        {/* Topic input */}
        <div className="glass rounded-2xl p-6 mb-4">
          <label className="block text-sm text-[#999] mb-3">What do you want to understand?</label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && e.metaKey && generate()}
            placeholder="E.g. Quantum entanglement, The French Revolution, How neural networks work..."
            className="w-full bg-transparent text-sm text-white placeholder-[#555] resize-none outline-none leading-relaxed min-h-24"
          />
        </div>

        {/* Level selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {levels.map(l => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`glass rounded-xl p-4 text-left transition-all ${
                level === l.id ? 'bg-white/10 border-white/30' : 'hover:bg-white/5'
              }`}
            >
              <div className="text-2xl mb-2">{l.emoji}</div>
              <div className="font-semibold text-sm mb-1">{l.label}</div>
              <div className="text-xs text-[#666]">{l.desc}</div>
              {level === l.id && (
                <div className="mt-2 w-2 h-2 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 text-sm mb-6"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Explaining...</>
          ) : (
            <><Lightbulb className="w-4 h-4" /> Explain this</>
          )}
        </button>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#999]" />
                <span className="text-sm font-medium">{level} explanation</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveToNotebook}
                  disabled={savingNote}
                  className="flex items-center gap-1 text-xs text-[#666] hover:text-white transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {savingNote ? 'Saving...' : 'Save to Notebook'}
                </button>
                <button
                  onClick={copy}
                  className="flex items-center gap-1 text-xs text-[#666] hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="text-sm leading-relaxed text-[#e5e5e5] whitespace-pre-wrap">
              {result}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
