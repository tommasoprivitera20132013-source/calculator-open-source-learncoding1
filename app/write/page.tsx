'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenTool, Wand2, Download, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import type { WriteMode, WriteLanguage, WriteTone } from '@/types'

const MODES: WriteMode[] = ['Lyrics/Rap', 'Story', 'Essay', 'Email', 'Code', 'Social Caption', 'Script', 'Ad Copy']
const LANGUAGES: WriteLanguage[] = ['English', 'Italian', 'Spanish', 'French', 'German']
const TONES: WriteTone[] = ['Professional', 'Casual', 'Creative', 'Aggressive', 'Poetic']

export default function WritePage() {
  const [mode, setMode] = useState<WriteMode>('Essay')
  const [language, setLanguage] = useState<WriteLanguage>('English')
  const [tone, setTone] = useState<WriteTone>('Creative')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null)

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return }
    setGenerating(true)
    setResult('')

    try {
      const res = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, language, tone }),
      })

      const remaining = res.headers.get('X-Remaining-Requests')
      if (remaining) setRemainingRequests(Number(remaining))

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Generation failed')
      }

      // Stream response
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setResult(accumulated)
      }

      toast.success('Text generated!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function downloadTxt() {
    if (!result) return
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aura-write-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyToClipboard() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <PenTool size={16} className="text-white/70" />
            </div>
            <h1 className="text-xl font-bold">AURA Write</h1>
            {remainingRequests !== null && (
              <span className="text-xs text-white/40 ml-auto">
                {remainingRequests} requests remaining today
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm">Generate any kind of text in multiple languages</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── Left controls ── */}
          <div className="space-y-5">
            {/* Mode */}
            <div className="glass rounded-2xl p-5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Mode</label>
              <div className="space-y-1">
                {MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                      mode === m
                        ? 'bg-white text-black font-medium'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="glass rounded-2xl p-5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Language</label>
              <div className="space-y-1">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                      language === l
                        ? 'bg-white text-black font-medium'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="glass rounded-2xl p-5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Tone</label>
              <div className="space-y-1">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                      tone === t
                        ? 'bg-white text-black font-medium'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: prompt + result ── */}
          <div className="flex flex-col gap-5">
            {/* Prompt */}
            <div className="glass rounded-2xl p-5">
              <label className="block text-xs font-medium text-white/60 mb-2">Your prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Write a ${mode.toLowerCase()} about…`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 resize-none"
                rows={5}
                disabled={generating}
              />
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    Writing…
                  </>
                ) : (
                  <>
                    <Wand2 size={15} />
                    Generate {mode}
                  </>
                )}
              </button>
            </div>

            {/* Result */}
            <AnimatePresence>
              {(result || generating) && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/50">Generated {mode}</span>
                    {result && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                        >
                          {copied ? <Check size={13} /> : <Copy size={13} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={downloadTxt}
                          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                        >
                          <Download size={13} />
                          .txt
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="max-h-[480px] overflow-y-auto">
                    {result ? (
                      <pre className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-sans">
                        {result}
                        {generating && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="inline-block w-0.5 h-4 bg-white ml-0.5 align-middle"
                          />
                        )}
                      </pre>
                    ) : (
                      <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-4 bg-white/[0.06] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
