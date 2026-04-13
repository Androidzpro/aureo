import { cn } from '@/lib/data'

interface FlowLogoProps {
  size?: number
  className?: string
  variant?: 'full' | 'icon' | 'text'
  theme?: 'light' | 'dark'
}

export function FlowLogo({ size = 28, className, variant = 'full', theme = 'dark' }: FlowLogoProps) {
  const isDark = theme === 'dark'
  const textColor = isDark ? 'text-gray-900' : 'text-white'

  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
        {/* F with flow lines suggesting money flow */}
        <path d="M9 10h9a3 3 0 0 1 0 6H9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M9 16h7a3 3 0 0 1 0 6H9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Upward arrow suggesting growth */}
        <path d="M20 14l2-2m0 0l2-2m-2 2h-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
            <stop stopColor="#059669" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#logo-gradient-full)" />
        <path d="M9 10h9a3 3 0 0 1 0 6H9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M9 16h7a3 3 0 0 1 0 6H9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 14l2-2m0 0l2-2m-2 2h-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        <defs>
          <linearGradient id="logo-gradient-full" x1="0" y1="0" x2="32" y2="32">
            <stop stopColor="#059669" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>
      {variant !== 'icon' && (
        <span className={cn('text-lg font-bold tracking-tight', textColor)}>
          Flow<span className="text-emerald-600">Fin</span>
        </span>
      )}
    </div>
  )
}
