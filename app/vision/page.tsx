'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Download, Wand2, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase'
import type { Generation, ImageStyle, ImageResolution } from '@/types'

const STYLES: ImageStyle[] = ['Realistic', 'Cinematic', 'Anime', 'Oil Painting', 'Minimal', 'Cyberpunk', 'Watercolor']
const RESOLUTIONS: ImageResolution[] = ['512x512', '1024x1024', '1792x1024']

const PAGE_SIZE = 12

export default function VisionPage() {
  const supabase = createClient()

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [style, setStyle] = useState<ImageStyle>('Realistic')
  const [resolution, setResolution] = useState<ImageResolution>('1024x1024')
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)

  const [gallery, setGallery] = useState<Generation[]>([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [remainingRequests, setRemainingRequests] = useState<number | null>(null)

  useEffect(() => {
    fetchGallery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function fetchGallery() {
    setGalleryLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, count, error } = await supabase
      .from('generations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('tool', 'vision')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) { toast.error('Failed to load gallery'); setGalleryLoading(false); return }
    setGallery(data ?? [])
    setTotalCount(count ?? 0)
    setGalleryLoading(false)
  }

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return }
    setGenerating(true)
    setGeneratedUrl(null)

    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, negativePrompt, style, resolution }),
      })

      const remaining = res.headers.get('X-Remaining-Requests')
      if (remaining) setRemainingRequests(Number(remaining))

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Generation failed')
      }

      const { url } = await res.json()
      setGeneratedUrl(url)
      toast.success('Image generated!')
      fetchGallery()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function downloadImage(url: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = `aura-vision-${Date.now()}.png`
    a.target = '_blank'
    a.click()
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ImageIcon size={16} className="text-white/70" />
            </div>
            <h1 className="text-xl font-bold">AURA Vision</h1>
            {remainingRequests !== null && (
              <span className="text-xs text-white/40 ml-auto">
                {remainingRequests} requests remaining today
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm">Generate stunning images with AI</p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 mb-10">

          {/* ── Left panel: controls ── */}
          <div className="glass rounded-2xl p-5 space-y-5">
            {/* Prompt */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A breathtaking mountain landscape at golden hour..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 resize-none"
                rows={4}
              />
            </div>

            {/* Style selector */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Style</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      style === s
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Negative prompt */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Negative Prompt</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="blurry, low quality, distorted..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/25 resize-none"
                rows={2}
              />
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as ImageResolution)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/25 appearance-none cursor-pointer"
              >
                {RESOLUTIONS.map((r) => <option key={r} value={r} className="bg-[#111]">{r}</option>)}
              </select>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 size={15} />
                  Generate Image
                </>
              )}
            </button>
          </div>

          {/* ── Right panel: generated image ── */}
          <div className="glass rounded-2xl overflow-hidden flex items-center justify-center min-h-[320px] relative">
            <AnimatePresence mode="wait">
              {generating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 text-white/40"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                  <p className="text-sm">Creating your masterpiece…</p>
                </motion.div>
              ) : generatedUrl ? (
                <motion.div
                  key="image"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full h-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedUrl}
                    alt="Generated"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => downloadImage(generatedUrl)}
                    className="absolute top-3 right-3 glass rounded-xl p-2.5 text-white/70 hover:text-white transition-all"
                  >
                    <Download size={16} />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 text-white/30"
                >
                  <ImageIcon size={40} />
                  <p className="text-sm">Your generated image will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Gallery ── */}
        <div>
          <h2 className="text-sm font-semibold text-white/60 mb-4">
            Your Generations
            {totalCount > 0 && <span className="ml-2 text-white/30">({totalCount})</span>}
          </h2>

          {galleryLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="glass rounded-2xl py-12 text-center text-white/30 text-sm">
              No generations yet — create your first image above
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {gallery.map((gen) => (
                  <div key={gen.id} className="group relative aspect-square rounded-xl overflow-hidden bg-white/5">
                    {gen.result_url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={gen.result_url}
                          alt={gen.prompt}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => downloadImage(gen.result_url!)}
                            className="glass rounded-lg p-2 text-white hover:bg-white/20 transition-all"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <Skeleton className="w-full h-full" />
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="glass rounded-xl p-2 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-white/40">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="glass rounded-xl p-2 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
