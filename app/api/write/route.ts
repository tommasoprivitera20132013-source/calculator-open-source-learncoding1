import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { anthropic, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan, WriteMode, WriteTone, WriteLanguage } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'write')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached. Upgrade your plan.' }, { status: 403 })

  const { prompt, mode, tone, language }: {
    prompt: string
    mode: WriteMode
    tone: WriteTone
    language: WriteLanguage
  } = await request.json()

  const userPrompt = `Mode: ${mode}\nTone: ${tone}\nLanguage: ${language}\n\nRequest: ${prompt}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPTS.write,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const result = msg.content[0].type === 'text' ? msg.content[0].text : ''

  await supabase.from('generations').insert({
    user_id: user.id,
    tool: 'write',
    prompt,
    result_url: null,
    metadata: { mode, tone, language, result },
  })

  return NextResponse.json({ result })
}
