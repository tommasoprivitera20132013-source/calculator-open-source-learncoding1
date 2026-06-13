'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code as CodeIcon, Wand2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import type { CodeLanguage, CodeMode } from '@/types'

const LANGUAGES: CodeLanguage[] = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Swift', 'PHP', 'SQL']
const MODES: CodeMode[] = ['Generate', 'Explain', 'Fix bugs', 'Optimize', 'Convert language']

const MODE_PLACEHOLDERS: Record<CodeMode, string> = {
  'Generate': 'Describe the code you want to generate…\n\nExample: "A React hook that debounces a value with configurable delay"',
  'Explain': 'Paste the code you want explained…',
  'Fix bugs': 'Paste the buggy code here…',
  'Optimize': 'Paste the code you want optimized…',
  'Convert language': 'Paste the code you want to convert…',
}

export default function CodePage() {
  const [language, setLanguage] = useState<CodeLanguage>('TypeScript')
  const [mode, setMode] = useState<CodeMode>('Generate')
  const [targetLanguage, setTargetLanguage] = useState<CodeLanguage>('Python')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null)

  async function handleGenerate() {
    if (!input.trim()) { toast.error('Enter your request or code first'); return }
    setGenerating(true)
    setOutput('')

    try {
      const res = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          language,
          mode,
          targetLanguage: mode === 'Convert language' ? targetLanguage : undefined,
        }),
      })

      const remaining = res.headers.get('X-Remaining-Requests')
      if (remaining) setRemainingRequests(Number(remaining))

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Generation failed')
      }

      // Stream
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setOutput(accumulated)
      }

      toast.success('Done!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function copyOutput() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <CodeIcon size={16} className="text-white/70" />
            </div>
            <h1 className="text-xl font-bold">AURA Code</h1>
            {remainingRequests !== null && (
              <span className="text-xs text-white/40 ml-auto">
                {remainingRequests} requests remaining today
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm">Generate, explain, fix, and optimize code</p>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Language */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/25 cursor-pointer"
            >
              {LANGUAGES.map((l) => <option key={l} value={l} className="bg-[#111]">{l}</option>)}
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Mode</label>
            <div className="flex gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    mode === m
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Target language (convert only) */}
          <AnimatePresence>
            {mode === 'Convert language' && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs text-white/40 mb-1.5">Convert to</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value as CodeLanguage)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-white/25 cursor-pointer"
                >
                  {LANGUAGES.filter((l) => l !== language).map((l) => (
                    <option key={l} value={l} className="bg-[#111]">{l}</option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="ml-auto">
            <div className="h-5" />
            <button
              onClick={handleGenerate}
              disabled={generating || !input.trim()}
              className="flex items-center gap-2 bg-white text-black font-semibold px-5 py-2 rounded-xl text-sm hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Wand2 size={14} />
                  {mode}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Two-panel editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input panel */}
          <div className="glass rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-medium text-white/50">
                {mode === 'Generate' ? 'Describe what you want' : 'Input Code'}
              </span>
              <span className="text-xs text-white/30">{language}</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={MODE_PLACEHOLDERS[mode]}
              className="flex-1 bg-transparent px-4 py-4 text-sm text-white/80 placeholder-white/20 outline-none resize-none font-mono leading-relaxed min-h-[400px] lg:min-h-[500px]"
              disabled={generating}
            />
          </div>

          {/* Output panel */}
          <div className="glass rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-medium text-white/50">
                {mode === 'Explain' ? 'Explanation' : `Output — ${mode === 'Convert language' ? targetLanguage : language}`}
              </span>
              {output && (
                <button
                  onClick={copyOutput}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            <div className="flex-1 px-4 py-4 overflow-y-auto min-h-[400px] lg:min-h-[500px]">
              {generating && !output ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-4 bg-white/[0.05] rounded"
                      style={{ width: `${30 + Math.random() * 70}%` }}
                    />
                  ))}
                </div>
              ) : output ? (
                <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed">
                  {output}
                  {generating && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-0.5 h-4 bg-white ml-0.5 align-middle"
                    />
                  )}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-white/20 text-sm">
                  Output will appear here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
