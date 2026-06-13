import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { anthropic, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan, Flashcard } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'flashcards')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 })

  const { text, count = 10 }: { text: string; count?: number } = await request.json()

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPTS.flashcards,
    messages: [{
      role: 'user',
      content: `Generate ${count} flashcards from this text. Return ONLY a JSON array with objects having "front" (question) and "back" (answer) fields.\n\nText:\n${text}`,
    }],
  })

  const content = msg.content[0].type === 'text' ? msg.content[0].text : '[]'

  let flashcards: Pick<Flashcard, 'front' | 'back'>[] = []
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) flashcards = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Failed to parse flashcards' }, { status: 500 })
  }

  return NextResponse.json({ flashcards })
}
