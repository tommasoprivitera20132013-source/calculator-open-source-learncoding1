import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { replicate, MUSIC_MODEL } from '@/lib/replicate'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan, MusicDuration } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  const { allowed } = await checkRateLimit(user.id, plan, 'music')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached. Upgrade your plan.' }, { status: 403 })

  const { prompt, duration }: { prompt: string; duration: MusicDuration } = await request.json()

  const output = await replicate.run(MUSIC_MODEL as `${string}/${string}:${string}`, {
    input: {
      prompt,
      duration,
      model_version: 'large',
      output_format: 'mp3',
    },
  })

  const audioUrl = Array.isArray(output) ? output[0] : String(output)

  await supabase.from('generations').insert({
    user_id: user.id,
    tool: 'music',
    prompt,
    result_url: audioUrl,
    metadata: { duration },
  })

  return NextResponse.json({ url: audioUrl })
}
