import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'default'
  | 'pro'
  | 'ultra'
  | 'free'
  | 'success'
  | 'warning'
  | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-white/10 text-white/80 border-white/15',
  free:
    'bg-white/8 text-white/60 border-white/10',
  pro:
    'bg-blue-500/15 text-blue-300 border-blue-500/25',
  ultra:
    'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-500/30',
  success:
    'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  warning:
    'bg-amber-500/15 text-amber-300 border-amber-500/25',
  danger:
    'bg-red-500/15 text-red-300 border-red-500/25',
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
          'text-xs font-medium border',
          'whitespace-nowrap select-none',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Plan-specific badge with dot indicator
interface PlanBadgeProps {
  plan: 'free' | 'pro' | 'ultra'
  className?: string
}

const planLabels: Record<PlanBadgeProps['plan'], string> = {
  free: 'Free',
  pro: 'Pro',
  ultra: 'Ultra',
}

const planVariants: Record<PlanBadgeProps['plan'], BadgeVariant> = {
  free: 'free',
  pro: 'pro',
  ultra: 'ultra',
}

const planDotColors: Record<PlanBadgeProps['plan'], string> = {
  free: 'bg-white/40',
  pro: 'bg-blue-400',
  ultra: 'bg-purple-400',
}

function PlanBadge({ plan, className }: PlanBadgeProps) {
  return (
    <Badge variant={planVariants[plan]} className={className}>
      <span className={cn('w-1.5 h-1.5 rounded-full', planDotColors[plan])} />
      {planLabels[plan]}
    </Badge>
  )
}

export { Badge, PlanBadge }
export type { BadgeProps, BadgeVariant, PlanBadgeProps }
