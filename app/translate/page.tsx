'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowLeftRight, Copy, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const languages = [
  'Italian', 'English', 'Spanish', 'French', 'German', 'Portuguese', 'Russian',
  'Chinese (Simplified)', 'Japanese', 'Korean', 'Arabic', 'Dutch', 'Swedish',
  'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Romanian',
  'Greek', 'Turkish', 'Hindi', 'Bengali', 'Thai', 'Vietnamese', 'Indonesian',
  'Malay', 'Tagalog', 'Ukrainian', 'Hebrew',
]

export default function TranslatePage() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('English')
  const [tone, setTone] = useState<'formal' | 'casual'>('formal')
  const [autoDetect, setAutoDetect] = useState(true)
  const [loading, setLoading] = useState(false)

  const translate = async () => {
    if (!inputText.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, targetLanguage, tone, autoDetect }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Translation failed')
        return
      }
      const { result } = await res.json()
      setOutputText(result)
    } catch {
      toast.error('Translation failed')
    } finally {
      setLoading(false)
    }
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(outputText)
    toast.success('Copied!')
  }

  const swapLanguages = () => {
    setInputText(outputText)
    setOutputText(inputText)
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">AURA Translate</h1>
          <p className="text-[#666] text-sm">Translate between 30+ languages with formal or casual tone</p>
        </div>

        {/* Controls */}
        <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666]">Target:</span>
            <select
              value={targetLanguage}
              onChange={e => setTargetLanguage(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
            >
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666]">Tone:</span>
            <div className="flex gap-1">
              {(['formal', 'casual'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    tone === t ? 'bg-white text-black' : 'bg-white/5 text-[#999] hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDetect}
              onChange={e => setAutoDetect(e.target.checked)}
              className="w-4 h-4 accent-white"
            />
            <span className="text-xs text-[#999]">Auto-detect language</span>
          </label>

          <button
            onClick={translate}
            disabled={loading || !inputText.trim()}
            className="ml-auto flex items-center gap-2 bg-white text-black font-semibold px-5 py-2 rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Translate
          </button>
        </div>

        {/* Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          <div className="glass rounded-2xl p-4">
            <div className="text-xs text-[#666] mb-2 uppercase tracking-wider">Source text</div>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full h-64 bg-transparent text-sm text-white placeholder-[#555] resize-none outline-none leading-relaxed"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-[#555]">{inputText.length} characters</span>
            </div>
          </div>

          <button
            onClick={swapLanguages}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex bg-[#111] border border-white/10 rounded-full p-2 hover:bg-white/10 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div className="glass rounded-2xl p-4">
            <div className="text-xs text-[#666] mb-2 uppercase tracking-wider flex justify-between">
              <span>Translation — {targetLanguage}</span>
              {outputText && (
                <button onClick={copyOutput} className="flex items-center gap-1 text-[#666] hover:text-white transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
              )}
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
              </div>
            ) : (
              <div className="h-64 overflow-y-auto text-sm leading-relaxed text-white whitespace-pre-wrap">
                {outputText || <span className="text-[#555]">Translation will appear here...</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
