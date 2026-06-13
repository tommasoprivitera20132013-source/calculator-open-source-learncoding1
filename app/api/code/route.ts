import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { anthropic, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan, CodeLanguage, CodeMode } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'code')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached. Upgrade your plan.' }, { status: 403 })

  const { code, language, mode, targetLanguage }: {
    code: string
    language: CodeLanguage
    mode: CodeMode
    targetLanguage?: CodeLanguage
  } = await request.json()

  const modePrompts: Record<CodeMode, string> = {
    'Generate': `Generate ${language} code for: ${code}`,
    'Explain': `Explain this ${language} code clearly:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``,
    'Fix bugs': `Find and fix all bugs in this ${language} code:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``,
    'Optimize': `Optimize this ${language} code for performance and readability:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``,
    'Convert language': `Convert this ${language} code to ${targetLanguage ?? 'TypeScript'}:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``,
  }

  // Code assistant always uses Opus 4 as per spec
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8192,
    system: SYSTEM_PROMPTS.code,
    messages: [{ role: 'user', content: modePrompts[mode] }],
  })

  const result = msg.content[0].type === 'text' ? msg.content[0].text : ''

  await supabase.from('generations').insert({
    user_id: user.id,
    tool: 'code',
    prompt: code,
    result_url: null,
    metadata: { language, mode, result },
  })

  return NextResponse.json({ result })
}
