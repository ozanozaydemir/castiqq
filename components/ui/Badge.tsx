import { cn } from '@/lib/utils'

const variants = {
  default:     'bg-gray-100 text-gray-600',
  indigo:      'bg-indigo-50 text-indigo-700',
  green:       'bg-green-50 text-green-700',
  yellow:      'bg-yellow-50 text-yellow-700',
  red:         'bg-red-50 text-red-700',
  purple:      'bg-purple-50 text-purple-700',
  orange:      'bg-orange-50 text-orange-700',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
