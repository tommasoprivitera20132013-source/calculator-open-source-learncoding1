import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { anthropic, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan, ExplainLevel } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'explain')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 })

  const { topic, level }: { topic: string; level: ExplainLevel } = await request.json()

  const levelInstructions: Record<ExplainLevel, string> = {
    Child: 'Explain as if talking to a 10-year-old child. Use simple words, fun analogies, and relatable examples.',
    Student: 'Explain as if teaching a high school or university student. Be clear and educational with examples.',
    Expert: 'Explain at an expert level with technical depth, nuance, and advanced concepts.',
  }

  const userPrompt = `${levelInstructions[level]}\n\nTopic: ${topic}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPTS.explain,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const result = msg.content[0].type === 'text' ? msg.content[0].text : ''
  return NextResponse.json({ result })
}
