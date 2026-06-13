'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, RotateCcw, ChevronLeft, ChevronRight, Trash2, Save, Sparkles, BookOpen, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase'

interface Flashcard {
  id?: string
  front: string
  back: string
}

interface Deck {
  id: string
  name: string
  card_count?: number
  created_at?: string
  cards?: Flashcard[]
}

type Tab = 'my-decks' | 'create'

export default function FlashcardsPage() {
  const [tab, setTab] = useState<Tab>('my-decks')
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)

  // Study mode
  const [studyDeck, setStudyDeck] = useState<Deck | null>(null)
  const [currentCardIdx, setCurrentCardIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Create new
  const [pasteText, setPasteText] = useState('')
  const [deckName, setDeckName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([])
  const [saving, setSaving] = useState(false)

  // Manual add
  const [manualFront, setManualFront] = useState('')
  const [manualBack, setManualBack] = useState('')

  const supabase = createClient()

  const fetchDecks = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDecks(data || [])
    } catch {
      toast.error('Failed to load decks')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  const openDeck = async (deck: Deck) => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deck.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setStudyDeck({ ...deck, cards: data || [] })
      setCurrentCardIdx(0)
      setFlipped(false)
    } catch {
      toast.error('Failed to load cards')
    }
  }

  const generateCards = async () => {
    if (!pasteText.trim()) {
      toast.error('Please paste some text first')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setGeneratedCards(data.cards || [])
      toast.success(`Generated ${data.cards?.length || 0} flashcards!`)
    } catch {
      toast.error('Failed to generate flashcards')
    } finally {
      setGenerating(false)
    }
  }

  const saveGeneratedDeck = async () => {
    if (!deckName.trim()) {
      toast.error('Please enter a deck name')
      return
    }
    if (generatedCards.length === 0) {
      toast.error('No cards to save')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: deck, error: deckErr } = await supabase
        .from('flashcard_decks')
        .insert({ name: deckName, user_id: user.id, card_count: generatedCards.length })
        .select()
        .single()

      if (deckErr) throw deckErr

      const cards = generatedCards.map(c => ({ ...c, deck_id: deck.id, user_id: user.id }))
      const { error: cardsErr } = await supabase.from('flashcards').insert(cards)
      if (cardsErr) throw cardsErr

      toast.success('Deck saved!')
      setGeneratedCards([])
      setPasteText('')
      setDeckName('')
      fetchDecks()
      setTab('my-decks')
    } catch {
      toast.error('Failed to save deck')
    } finally {
      setSaving(false)
    }
  }

  const addManualCard = () => {
    if (!manualFront.trim() || !manualBack.trim()) {
      toast.error('Fill in both front and back')
      return
    }
    setGeneratedCards(prev => [...prev, { front: manualFront, back: manualBack }])
    setManualFront('')
    setManualBack('')
    toast.success('Card added!')
  }

  const deleteDeck = async (id: string) => {
    try {
      await supabase.from('flashcard_decks').delete().eq('id', id)
      setDecks(prev => prev.filter(d => d.id !== id))
      toast.success('Deck deleted')
    } catch {
      toast.error('Failed to delete deck')
    }
  }

  const currentCard = studyDeck?.cards?.[currentCardIdx]

  // ── Study Mode ──────────────────────────────────────────────────────────────
  if (studyDeck) {
    const cards = studyDeck.cards || []
    return (
      <DashboardLayout>
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => setStudyDeck(null)}
            className="flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to decks
          </button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">{studyDeck.name}</h1>
              <p className="text-white/40 text-sm mt-1">{cards.length} cards</p>
            </div>
            <div className="text-white/40 text-sm font-medium">
              {cards.length > 0 ? `${currentCardIdx + 1} / ${cards.length}` : '0 / 0'}
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-white/40">No cards in this deck.</div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full mb-8">
                <div
                  className="h-1 bg-white rounded-full transition-all duration-300"
                  style={{ width: `${((currentCardIdx + 1) / cards.length) * 100}%` }}
                />
              </div>

              {/* Card flip */}
              <div
                className="relative w-full cursor-pointer"
                style={{ perspective: '1200px', minHeight: '260px' }}
                onClick={() => setFlipped(f => !f)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentCardIdx}-${flipped ? 'back' : 'front'}`}
                    initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="glass rounded-2xl p-10 text-center"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="text-xs text-white/30 uppercase tracking-widest mb-6">
                      {flipped ? 'Answer' : 'Question'}
                    </div>
                    <p className="text-xl font-medium leading-relaxed">
                      {flipped ? currentCard?.back : currentCard?.front}
                    </p>
                    <p className="text-white/30 text-xs mt-8">Click to flip</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => { setCurrentCardIdx(i => Math.max(0, i - 1)); setFlipped(false) }}
                  disabled={currentCardIdx === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => { setFlipped(false); setCurrentCardIdx(i => Math.min(cards.length - 1, i + 1)) }}
                  disabled={currentCardIdx === cards.length - 1}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                >
                  Next <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => { setCurrentCardIdx(0); setFlipped(false) }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass hover:bg-white/10 transition-all text-sm"
                >
                  <RotateCcw size={16} /> Restart
                </button>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    )
  }

  // ── Main View ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AURA Flashcards</h1>
          <p className="text-white/40">Study smarter with AI-generated flashcards</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass rounded-xl w-fit mb-8">
          {(['my-decks', 'create'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
            >
              {t === 'my-decks' ? 'My Decks' : 'Create New'}
            </button>
          ))}
        </div>

        {/* My Decks */}
        {tab === 'my-decks' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
              </div>
            ) : decks.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <BookOpen className="w-10 h-10 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 mb-4">No decks yet. Create your first deck!</p>
                <button
                  onClick={() => setTab('create')}
                  className="px-5 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 transition-all"
                >
                  Create Deck
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map(deck => (
                  <motion.div
                    key={deck.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 hover:bg-white/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <BookOpen size={18} className="text-white/60" />
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteDeck(deck.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-white/30 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h3 className="font-semibold mb-1">{deck.name}</h3>
                    <p className="text-white/40 text-sm mb-4">{deck.card_count || 0} cards</p>
                    <button
                      onClick={() => openDeck(deck)}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-all"
                    >
                      Study Now
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create New */}
        {tab === 'create' && (
          <div className="space-y-6">
            {/* AI Generate */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-white/60" />
                Generate with AI
              </h2>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Paste your notes, article, or any text here..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
              />
              <button
                onClick={generateCards}
                disabled={generating}
                className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {generating ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles size={14} /> Generate Flashcards</>
                )}
              </button>
            </div>

            {/* Manual add */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Plus size={16} className="text-white/60" />
                Add Card Manually
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-2 block">Front</label>
                  <textarea
                    value={manualFront}
                    onChange={e => setManualFront(e.target.value)}
                    placeholder="Question or term..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-2 block">Back</label>
                  <textarea
                    value={manualBack}
                    onChange={e => setManualBack(e.target.value)}
                    placeholder="Answer or definition..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  />
                </div>
              </div>
              <button
                onClick={addManualCard}
                className="mt-3 flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm hover:bg-white/10 transition-all"
              >
                <Plus size={14} /> Add Card
              </button>
            </div>

            {/* Generated cards preview */}
            {generatedCards.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">{generatedCards.length} Cards Ready</h2>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
                  {generatedCards.map((card, i) => (
                    <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-xl text-sm">
                      <div className="flex-1">
                        <span className="text-white/40 text-xs">Q: </span>{card.front}
                      </div>
                      <div className="flex-1">
                        <span className="text-white/40 text-xs">A: </span>{card.back}
                      </div>
                      <button
                        onClick={() => setGeneratedCards(prev => prev.filter((_, j) => j !== i))}
                        className="text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <input
                    value={deckName}
                    onChange={e => setDeckName(e.target.value)}
                    placeholder="Deck name..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <button
                    onClick={saveGeneratedDeck}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saving ? (
                      <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Save Deck
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
