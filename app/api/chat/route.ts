import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { anthropic, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { PLAN_MODELS } from '@/lib/utils'
import { Plan } from '@/types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed, remaining } = await checkRateLimit(user.id, plan, 'chat')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Daily limit reached. Upgrade your plan for more requests.' },
      { status: 403 }
    )
  }

  const { messages, chatId } = await request.json()
  const model = PLAN_MODELS.brain[plan]

  const stream = await anthropic.messages.stream({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPTS.brain,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  // Save assistant message after streaming (fire and forget)
  stream.finalMessage().then(async (msg) => {
    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    if (chatId && content) {
      await supabase.from('messages').insert({
        chat_id: chatId,
        user_id: user.id,
        role: 'assistant',
        content,
      })
    }
  }).catch(() => {})

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Remaining-Requests': String(remaining),
    },
  })
}
