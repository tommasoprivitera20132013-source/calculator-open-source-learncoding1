import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { anthropic, SYSTEM_PROMPTS } from '@/lib/anthropic'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan, MindMapData } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'mindmap')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 })

  const { topic }: { topic: string } = await request.json()

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPTS.mindmap,
    messages: [{
      role: 'user',
      content: `Generate a mind map for: "${topic}". Return ONLY a JSON object with "nodes" (array of {id, position: {x, y}, data: {label}}) and "edges" (array of {id, source, target}). Create 8-15 nodes with a central node at {x:0, y:0} and related concepts branching out in a radial layout.`,
    }],
  })

  const content = msg.content[0].type === 'text' ? msg.content[0].text : '{}'

  let mindMapData: MindMapData = { nodes: [], edges: [] }
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) mindMapData = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Failed to parse mind map' }, { status: 500 })
  }

  return NextResponse.json({ data: mindMapData })
}
