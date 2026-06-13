'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Wand2, Download, Play, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase'
import type { Generation, MusicDuration } from '@/types'

const DURATIONS: { value: MusicDuration; label: string }[] = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
]

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/40 mb-2">
        <span>Generating music…</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

export default function MusicPage() {
  const supabase = createClient()

  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState<MusicDuration>(30)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)

  const [history, setHistory] = useState<Generation[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null)

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchHistory()
    return () => { if (progressInterval.current) clearInterval(progressInterval.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchHistory() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .eq('tool', 'music')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) { toast.error('Failed to load history'); setHistoryLoading(false); return }
    setHistory(data ?? [])
    setHistoryLoading(false)
  }

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Describe the music you want'); return }
    setGenerating(true)
    setProgress(0)
    setGeneratedUrl(null)

    // Fake progress bar (music generation takes 20–60s)
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) { clearInterval(progressInterval.current!); return 90 }
        return prev + Math.random() * 4
      })
    }, 800)

    try {
      const res = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration }),
      })

      const remaining = res.headers.get('X-Remaining-Requests')
      if (remaining) setRemainingRequests(Number(remaining))

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Generation failed')
      }

      clearInterval(progressInterval.current!)
      setProgress(100)

      const { url } = await res.json()
      setGeneratedUrl(url)
      toast.success('Music generated!')
      fetchHistory()
    } catch (err: unknown) {
      clearInterval(progressInterval.current!)
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function downloadAudio(url: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = `aura-music-${Date.now()}.mp3`
    a.target = '_blank'
    a.click()
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Music size={16} className="text-white/70" />
            </div>
            <h1 className="text-xl font-bold">AURA Music</h1>
            {remainingRequests !== null && (
              <span className="text-xs text-white/40 ml-auto">
                {remainingRequests} requests remaining today
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm">Generate original music from your description</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 space-y-5 mb-8">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">Describe your music</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="An upbeat lo-fi hip-hop track with soft piano, mellow drums and a relaxed jazzy feel..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 resize-none"
              rows={4}
              disabled={generating}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">Duration</label>
            <div className="flex gap-3">
              {DURATIONS.map((d) => (
                <label key={d.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    value={d.value}
                    checked={duration === d.value}
                    onChange={() => setDuration(d.value)}
                    className="sr-only"
                    disabled={generating}
                  />
                  <div
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      duration === d.value
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Generate button / progress */}
          {generating ? (
            <ProgressBar progress={progress} />
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Wand2 size={15} />
              Generate Music
            </button>
          )}
        </div>

        {/* Generated audio player */}
        <AnimatePresence>
          {generatedUrl && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass rounded-2xl p-5 mb-8"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Play size={14} className="text-white/60" />
                  <span className="text-sm font-medium">Generated Track</span>
                </div>
                <button
                  onClick={() => downloadAudio(generatedUrl)}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                >
                  <Download size={13} />
                  Download MP3
                </button>
              </div>
              <audio
                controls
                src={generatedUrl}
                className="w-full"
                style={{ accentColor: '#fff', colorScheme: 'dark' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <div>
          <h2 className="text-sm font-semibold text-white/60 mb-4">History</h2>

          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="glass rounded-2xl py-12 text-center text-white/30 text-sm">
              No generations yet — create your first track above
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((gen) => (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm text-white/70 line-clamp-2 flex-1">{gen.prompt}</p>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-white/30">
                        <Clock size={11} />
                        {(gen.metadata as Record<string, unknown>)?.duration as number}s
                      </div>
                      {gen.result_url && (
                        <button
                          onClick={() => downloadAudio(gen.result_url!)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {gen.result_url && (
                    <audio
                      controls
                      src={gen.result_url}
                      className="w-full h-8"
                      style={{ accentColor: '#fff', colorScheme: 'dark' }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
