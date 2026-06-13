import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { anthropic } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan } from '@/types'

type NotebookCommand = 'Expand' | 'Summarize' | 'Fix grammar' | 'Translate' | 'Explain simply'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'notebook')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 })

  const { text, command }: { text: string; command: NotebookCommand } = await request.json()

  const commandPrompts: Record<NotebookCommand, string> = {
    Expand: `Expand the following text with more detail, context, and examples:\n\n${text}`,
    Summarize: `Summarize the following text concisely in 2-3 sentences:\n\n${text}`,
    'Fix grammar': `Fix all grammar, spelling, and punctuation errors in the following text. Return only the corrected text:\n\n${text}`,
    Translate: `Translate the following text to English (if not already in English) or Italian (if in English):\n\n${text}`,
    'Explain simply': `Rewrite the following text in simple, easy-to-understand language:\n\n${text}`,
  }

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: commandPrompts[command] }],
  })

  const result = msg.content[0].type === 'text' ? msg.content[0].text : ''
  return NextResponse.json({ result })
}
