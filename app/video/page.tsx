'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video as VideoIcon, Wand2, Download, Lock, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase'
import type { Plan } from '@/types'

function LockOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-[#0a0a0a]/80 backdrop-blur-sm rounded-2xl"
    >
      <div className="glass rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-white/60" />
        </div>
        <h3 className="text-lg font-bold mb-2">Ultra Plan Required</h3>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          AURA Video is powered by Runway ML and is available exclusively on the Ultra plan.
        </p>
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 px-6 rounded-xl text-sm hover:bg-white/90 transition-all"
        >
          <Sparkles size={14} />
          Upgrade to Ultra
        </Link>
      </div>
    </motion.div>
  )
}

function ProgressBar({ progress, label }: { progress: number; label: string }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/40 mb-2">
        <span>{label}</span>
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

export default function VideoPage() {
  const supabase = createClient()

  const [userPlan, setUserPlan] = useState<Plan | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('Generating video…')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null)

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function fetchPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setPlanLoading(false); return }

      const { data } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single()

      setUserPlan((data?.plan as Plan) ?? 'free')
      setPlanLoading(false)
    }
    fetchPlan()

    return () => { if (progressInterval.current) clearInterval(progressInterval.current) }
  }, [supabase])

  const isLocked = !planLoading && userPlan !== 'ultra'

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return }
    setGenerating(true)
    setProgress(0)
    setVideoUrl(null)

    const labels = [
      'Analyzing your prompt…',
      'Composing scenes…',
      'Rendering frames…',
      'Applying motion…',
      'Finalizing video…',
    ]
    let labelIdx = 0

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 3
        if (next >= 90) { clearInterval(progressInterval.current!); return 90 }
        const step = Math.floor((next / 90) * labels.length)
        if (step < labels.length && step !== labelIdx) {
          labelIdx = step
          setProgressLabel(labels[step])
        }
        return next
      })
    }, 1200)

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const remaining = res.headers.get('X-Remaining-Requests')
      if (remaining) setRemainingRequests(Number(remaining))

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Generation failed')
      }

      clearInterval(progressInterval.current!)
      setProgress(100)
      setProgressLabel('Complete!')

      const { url } = await res.json()
      setVideoUrl(url)
      toast.success('Video generated!')
    } catch (err: unknown) {
      clearInterval(progressInterval.current!)
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function downloadVideo() {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `aura-video-${Date.now()}.mp4`
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
              <VideoIcon size={16} className="text-white/70" />
            </div>
            <h1 className="text-xl font-bold">AURA Video</h1>
            {!isLocked && remainingRequests !== null && (
              <span className="text-xs text-white/40 ml-auto">
                {remainingRequests} requests remaining today
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm">Text-to-video generation powered by Runway ML</p>
        </div>

        {/* Main content with lock overlay */}
        <div className="relative">
          {/* Lock overlay */}
          {!planLoading && isLocked && <LockOverlay />}

          {/* Plan loading skeleton */}
          {planLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
            </div>
          )}

          <div className={planLoading || isLocked ? 'opacity-20 pointer-events-none select-none' : ''}>

            {/* Form */}
            <div className="glass rounded-2xl p-6 space-y-5 mb-6">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Video Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A drone shot flying over a futuristic neon city at night, raining, cinematic..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 resize-none"
                  rows={4}
                  disabled={generating}
                />
              </div>

              {generating ? (
                <ProgressBar progress={progress} label={progressLabel} />
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Wand2 size={15} />
                  Generate Video
                </button>
              )}
            </div>

            {/* Video player */}
            <AnimatePresence>
              {videoUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <span className="text-sm font-medium">Generated Video</span>
                    <button
                      onClick={downloadVideo}
                      className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                    >
                      <Download size={13} />
                      Download MP4
                    </button>
                  </div>
                  <div className="p-4">
                    <video
                      controls
                      src={videoUrl}
                      className="w-full rounded-xl"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!videoUrl && !generating && (
              <div className="glass rounded-2xl py-16 flex flex-col items-center gap-3 text-white/20">
                <VideoIcon size={40} />
                <p className="text-sm">Your generated video will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Plan info */}
        {!isLocked && !planLoading && (
          <p className="text-center text-white/20 text-xs mt-6">
            Video generation powered by Runway Gen-3 · Ultra plan only
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
