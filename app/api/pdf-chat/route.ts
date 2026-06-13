import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { anthropic, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'pdf-chat')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 })

  const { question, documentText, messages }: {
    question: string
    documentText: string
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  } = await request.json()

  const systemWithDoc = `${SYSTEM_PROMPTS.pdfchat}\n\n--- DOCUMENT CONTENT ---\n${documentText}\n--- END OF DOCUMENT ---`

  const allMessages = [...messages, { role: 'user' as const, content: question }]

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemWithDoc,
    messages: allMessages,
  })

  const result = msg.content[0].type === 'text' ? msg.content[0].text : ''
  return NextResponse.json({ result })
}
