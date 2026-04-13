import { cn } from '@/lib/data'

interface FlowLogoProps {
  size?: number
  className?: string
  variant?: 'full' | 'icon'
}

export function FlowLogo({ size = 28, className, variant = 'full' }: FlowLogoProps) {
  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
        <path d="M10 11h7.5a3.5 3.5 0 0 1 0 7H11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 18h7.5a3.5 3.5 0 0 0 0-7H11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#logo-gradient-full)" />
        <path d="M10 11h7.5a3.5 3.5 0 0 1 0 7H11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 18h7.5a3.5 3.5 0 0 0 0-7H11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <defs>
          <linearGradient id="logo-gradient-full" x1="0" y1="0" x2="32" y2="32">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
        Flow<span className="text-indigo-500">Fin</span>
      </span>
    </div>
  )
}
