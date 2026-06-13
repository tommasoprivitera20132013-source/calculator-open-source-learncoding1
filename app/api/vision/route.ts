import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { replicate, IMAGE_MODELS, STYLE_PROMPTS } from '@/lib/replicate'
import { checkRateLimit } from '@/lib/rateLimit'
import { Plan, ImageStyle, ImageResolution } from '@/types'

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

  const { allowed } = await checkRateLimit(user.id, plan, 'vision')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Daily limit reached. Upgrade your plan for more requests.' },
      { status: 403 }
    )
  }

  const { prompt, negativePrompt, style, resolution }: {
    prompt: string
    negativePrompt?: string
    style: ImageStyle
    resolution: ImageResolution
  } = await request.json()

  const [width, height] = resolution.split('x').map(Number)
  const styleModifier = STYLE_PROMPTS[style] ?? ''
  const fullPrompt = `${prompt}, ${styleModifier}`

  const model = IMAGE_MODELS[plan]

  const output = await replicate.run(model as `${string}/${string}`, {
    input: {
      prompt: fullPrompt,
      negative_prompt: negativePrompt ?? 'ugly, blurry, low quality, deformed',
      width,
      height,
      num_outputs: 1,
    },
  })

  const imageUrl = Array.isArray(output) ? output[0] : output

  // Save to Supabase storage and record generation
  await supabase.from('generations').insert({
    user_id: user.id,
    tool: 'vision',
    prompt: fullPrompt,
    result_url: String(imageUrl),
    metadata: { style, resolution, negative_prompt: negativePrompt },
  })

  return NextResponse.json({ url: imageUrl })
}
