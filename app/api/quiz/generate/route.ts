import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { anthropic, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan, QuizQuestion } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'quiz')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 })

  const { text, difficulty = 'Medium', count = 5 }: {
    text: string
    difficulty: 'Easy' | 'Medium' | 'Hard'
    count?: number
  } = await request.json()

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPTS.quiz,
    messages: [{
      role: 'user',
      content: `Generate ${count} ${difficulty.toLowerCase()} difficulty multiple choice questions from this text. Return ONLY a JSON array where each object has: "question" (string), "options" (array of 4 strings), "correct" (index 0-3), "explanation" (string).\n\nText:\n${text}`,
    }],
  })

  const content = msg.content[0].type === 'text' ? msg.content[0].text : '[]'

  let questions: QuizQuestion[] = []
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) questions = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Failed to parse questions' }, { status: 500 })
  }

  return NextResponse.json({ questions })
}
