import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { replicate, VIDEO_MODEL } from '@/lib/replicate'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as Plan

  if (plan !== 'ultra') {
    return NextResponse.json({ error: 'AURA Video requires the Ultra plan.' }, { status: 403 })
  }

  const { allowed } = await checkRateLimit(user.id, plan, 'video')
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 })

  const { prompt }: { prompt: string } = await request.json()

  const output = await replicate.run(VIDEO_MODEL as `${string}/${string}:${string}`, {
    input: {
      prompt,
      num_frames: 24,
      width: 1024,
      height: 576,
      fps: 8,
    },
  })

  const videoUrl = Array.isArray(output) ? output[0] : String(output)

  await supabase.from('generations').insert({
    user_id: user.id,
    tool: 'video',
    prompt,
    result_url: videoUrl,
    metadata: {},
  })

  return NextResponse.json({ url: videoUrl })
}
