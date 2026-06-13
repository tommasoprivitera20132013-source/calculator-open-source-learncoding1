'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Timer, ChevronRight, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

type Difficulty = 'Easy' | 'Medium' | 'Hard'
type QuestionCount = 5 | 10 | 15
type Phase = 'setup' | 'quiz' | 'results'

interface AnswerRecord {
  questionIdx: number
  chosen: number
  correct: boolean
}

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('setup')

  // Setup
  const [pasteText, setPasteText] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [generating, setGenerating] = useState(false)

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Results
  const [reviewIdx, setReviewIdx] = useState<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const startTimer = useCallback(() => {
    clearTimer()
    setTimeLeft(timerSeconds)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setChosen(-1)
          setShowFeedback(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [timerSeconds])

  useEffect(() => {
    if (phase === 'quiz' && timerEnabled && !showFeedback) {
      startTimer()
    }
    return clearTimer
  }, [phase, currentIdx, timerEnabled, showFeedback, startTimer])

  useEffect(() => () => clearTimer(), [])

  const generateQuiz = async () => {
    if (!pasteText.trim()) {
      toast.error('Please paste some text first')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText, difficulty, count: questionCount }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      if (!data.questions?.length) throw new Error('No questions returned')
      setQuestions(data.questions)
      setCurrentIdx(0)
      setAnswers([])
      setChosen(null)
      setShowFeedback(false)
      setPhase('quiz')
      toast.success(`${data.questions.length} questions generated!`)
    } catch {
      toast.error('Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswer = (optionIdx: number) => {
    if (showFeedback) return
    clearTimer()
    setChosen(optionIdx)
    setShowFeedback(true)
    const isCorrect = optionIdx === questions[currentIdx].correct
    setAnswers(prev => [...prev, { questionIdx: currentIdx, chosen: optionIdx, correct: isCorrect }])
  }

  const nextQuestion = () => {
    setChosen(null)
    setShowFeedback(false)
    if (currentIdx >= questions.length - 1) {
      setPhase('results')
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  const reset = () => {
    setPhase('setup')
    setQuestions([])
    setAnswers([])
    setCurrentIdx(0)
    setChosen(null)
    setShowFeedback(false)
    clearTimer()
  }

  const score = answers.filter(a => a.correct).length
  const currentQ = questions[currentIdx]

  // ── Setup ────────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">AURA Quiz</h1>
            <p className="text-white/40">Generate AI-powered quizzes from any text</p>
          </div>

          <div className="space-y-6">
            {/* Text input */}
            <div className="glass rounded-2xl p-6">
              <label className="text-sm font-medium mb-3 block">Paste your study material</label>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Paste text, notes, article content..."
                className="w-full h-44 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
              />
            </div>

            {/* Difficulty */}
            <div className="glass rounded-2xl p-6">
              <label className="text-sm font-medium mb-4 block">Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                      difficulty === d
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions count */}
            <div className="glass rounded-2xl p-6">
              <label className="text-sm font-medium mb-4 block">Number of Questions</label>
              <div className="grid grid-cols-3 gap-3">
                {([5, 10, 15] as QuestionCount[]).map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                      questionCount === n
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {n} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Timer size={16} className="text-white/40" />
                  Timer per question
                </label>
                <button
                  onClick={() => setTimerEnabled(t => !t)}
                  className={`w-11 h-6 rounded-full transition-all relative ${timerEnabled ? 'bg-white' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-all ${timerEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              {timerEnabled && (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={timerSeconds}
                    onChange={e => setTimerSeconds(Number(e.target.value))}
                    className="flex-1 accent-white"
                  />
                  <span className="text-sm text-white/60 w-16 text-right">{timerSeconds}s</span>
                </div>
              )}
            </div>

            <button
              onClick={generateQuiz}
              disabled={generating}
              className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {generating ? (
                <><div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" /> Generating...</>
              ) : (
                <><HelpCircle size={16} /> Generate Quiz</>
              )}
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const pct = Math.round((score / questions.length) * 100)
    const wrong = answers.filter(a => !a.correct)

    return (
      <DashboardLayout>
        <div className="p-6 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            {/* Score card */}
            <div className="glass rounded-2xl p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-white/60" />
              <h1 className="text-4xl font-bold mb-2">{pct}%</h1>
              <p className="text-white/40 mb-4">{score} of {questions.length} correct</p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171',
                  }}
                />
              </div>
              <p className="text-white/40 text-sm mt-4">
                {pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep studying!'}
              </p>
            </div>

            {/* Wrong answers review */}
            {wrong.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h2 className="font-semibold mb-4 text-sm text-white/60 uppercase tracking-wider">Review Wrong Answers ({wrong.length})</h2>
                <div className="space-y-3">
                  {wrong.map((ans, i) => {
                    const q = questions[ans.questionIdx]
                    const open = reviewIdx === i
                    return (
                      <div key={i} className="bg-white/5 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setReviewIdx(open ? null : i)}
                          className="w-full text-left px-4 py-3 flex items-center justify-between text-sm"
                        >
                          <span className="text-red-400/80 flex items-center gap-2">
                            <XCircle size={14} /> Q{ans.questionIdx + 1}: {q.question.slice(0, 60)}...
                          </span>
                          <ChevronRight size={14} className={`text-white/30 transition-transform ${open ? 'rotate-90' : ''}`} />
                        </button>
                        {open && (
                          <div className="px-4 pb-4 space-y-2 text-sm">
                            <p className="text-white/60"><span className="text-red-400">Your answer:</span> {q.options[ans.chosen] ?? 'Time expired'}</p>
                            <p className="text-white/60"><span className="text-green-400">Correct:</span> {q.options[q.correct]}</p>
                            <p className="text-white/40 mt-2 text-xs">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-3 glass rounded-xl hover:bg-white/10 transition-all text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> New Quiz
            </button>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-white/40">{currentIdx + 1} / {questions.length}</span>
          <div className="flex items-center gap-3">
            {timerEnabled && !showFeedback && (
              <div className={`flex items-center gap-1.5 text-sm ${timeLeft <= 10 ? 'text-red-400' : 'text-white/60'}`}>
                <Timer size={14} />
                {timeLeft}s
              </div>
            )}
            <span className="text-sm text-white/40">{difficulty}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full h-1 bg-white/10 rounded-full mb-8">
          <div
            className="h-1 bg-white rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="glass rounded-2xl p-6 mb-6">
              <p className="text-lg font-medium leading-relaxed">{currentQ.question}</p>
            </div>

            <div className="space-y-3">
              {currentQ.options.map((option, i) => {
                let style = 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                if (showFeedback) {
                  if (i === currentQ.correct) style = 'bg-green-500/20 border-green-500/50 text-green-300'
                  else if (i === chosen) style = 'bg-red-500/20 border-red-500/50 text-red-300'
                  else style = 'bg-white/5 border-white/10 text-white/40'
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showFeedback}
                    className={`w-full text-left px-5 py-4 rounded-xl border text-sm transition-all ${style} disabled:cursor-not-allowed`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs flex-shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                      {showFeedback && i === currentQ.correct && <CheckCircle2 size={16} className="ml-auto text-green-400" />}
                      {showFeedback && i === chosen && i !== currentQ.correct && <XCircle size={16} className="ml-auto text-red-400" />}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Feedback */}
            {showFeedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <div className="glass rounded-xl p-4 text-sm text-white/60">
                  <span className="font-medium text-white">Explanation: </span>
                  {currentQ.explanation}
                </div>
                <button
                  onClick={nextQuestion}
                  className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {currentIdx >= questions.length - 1 ? 'See Results' : 'Next Question'}
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
