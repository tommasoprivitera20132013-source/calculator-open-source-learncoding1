import { createServiceClient } from './supabase'
import { Plan, Usage } from '@/types'
import { PLAN_LIMITS } from './utils'

export async function checkRateLimit(userId: string, plan: Plan, tool: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: usage } = await supabase
    .from('usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single() as { data: Pick<Usage, 'count'> | null }

  const currentCount = usage?.count ?? 0
  const limit = PLAN_LIMITS[plan]

  if (plan === 'ultra') {
    await incrementUsage(userId, tool, today, currentCount)
    return { allowed: true, remaining: Infinity }
  }

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0 }
  }

  await incrementUsage(userId, tool, today, currentCount)
  return { allowed: true, remaining: limit - currentCount - 1 }
}

async function incrementUsage(userId: string, tool: string, date: string, current: number) {
  const supabase = await createServiceClient()
  await supabase.from('usage').upsert({
    user_id: userId,
    tool,
    date,
    count: current + 1,
  }, { onConflict: 'user_id,date' })
}
