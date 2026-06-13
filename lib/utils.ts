import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Plan } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 10,
  pro: 500,
  ultra: Infinity,
}

export const PLAN_MODELS = {
  brain: {
    free: 'claude-haiku-4-5-20251001',
    pro: 'claude-sonnet-4-6',
    ultra: 'claude-opus-4-8',
  },
  vision: {
    free: 'stability-ai/sdxl:39ed52f2319f9bc3da5c8a97e0cd5e2b1b3b1a3e',
    pro: 'black-forest-labs/flux-1.1-pro',
    ultra: 'black-forest-labs/flux-1.1-pro',
  },
} as const

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function truncate(str: string, length: number) {
  return str.length > length ? str.slice(0, length) + '...' : str
}
