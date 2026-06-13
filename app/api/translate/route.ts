import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { anthropic, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'translate')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 })

  const { text, targetLanguage, tone, autoDetect }: {
    text: string
    targetLanguage: string
    tone: 'formal' | 'casual'
    autoDetect: boolean
  } = await request.json()

  const userPrompt = `Translate the following text to ${targetLanguage} using a ${tone} tone${autoDetect ? ' (auto-detect source language)' : ''}. Return only the translation, no explanations:\n\n${text}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPTS.translate,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const result = msg.content[0].type === 'text' ? msg.content[0].text : ''
  return NextResponse.json({ result })
}
