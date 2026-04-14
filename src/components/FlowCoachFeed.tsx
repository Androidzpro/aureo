import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react'
import type { CoachAlert } from '@/lib/flowCoach'
import { cn } from '@/lib/data'

interface FlowCoachFeedProps {
  alerts: CoachAlert[]
}

const priorityConfig: Record<string, { bg: string; border: string; icon: React.ReactNode; badge: string; badgeBg: string }> = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-200 dark:border-red-800/30',
    icon: <AlertTriangle size={16} className="text-red-500" />,
    badge: 'Urgente',
    badgeBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800/30',
    icon: <AlertTriangle size={16} className="text-amber-500" />,
    badge: 'Atención',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  tip: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-800/30',
    icon: <Lightbulb size={16} className="text-emerald-500" />,
    badge: 'Tip',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  },
  positive: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-800/30',
    icon: <TrendingUp size={16} className="text-emerald-500" />,
    badge: 'Bien',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  },
}

export function FlowCoachBanner({ alerts }: FlowCoachFeedProps) {
  const criticalAlerts = alerts.filter(a => a.priority === 'critical')
  const warningAlerts = alerts.filter(a => a.priority === 'warning')
  const topAlert = criticalAlerts[0] || warningAlerts[0]
  const [dismissed, setDismissed] = useState<string | null>(null)

  if (!topAlert || dismissed === topAlert.id) return null

  const config = priorityConfig[topAlert.priority]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl p-3.5 border flex items-start gap-3', config.bg, config.border)}
    >
      <div className="mt-0.5 flex-shrink-0">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base">{topAlert.emoji}</span>
          <p className="text-xs font-bold text-gray-900 dark:text-white">{topAlert.title}</p>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{topAlert.message}</p>
      </div>
      <button onClick={() => setDismissed(topAlert.id)} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex-shrink-0">
        <X size={14} className="text-gray-400" />
      </button>
    </motion.div>
  )
}

export function FlowCoachFeed({ alerts }: FlowCoachFeedProps) {
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id))
  const criticalCount = alerts.filter(a => a.priority === 'critical').length
  const warningCount = alerts.filter(a => a.priority === 'warning').length

  if (visibleAlerts.length === 0) return null

  // Show first 2 by default, expand for more
  const defaultShow = 3
  const displayedAlerts = expanded ? visibleAlerts : visibleAlerts.slice(0, defaultShow)
  const hasMore = visibleAlerts.length > defaultShow

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <h2 className="text-xs font-bold text-gray-900 dark:text-white">Flow Coach</h2>
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="flex gap-1">
              {criticalCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              {warningCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
            </div>
          )}
        </div>
        <span className="text-[10px] text-gray-400">{visibleAlerts.length} insight{visibleAlerts.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Alerts */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
        <AnimatePresence>
          {displayedAlerts.map((alert, i) => {
            const config = priorityConfig[alert.priority]
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.03 }}
                className={cn('p-3.5', config.bg)}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex-shrink-0">
                    <span className="text-base">{alert.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{alert.title}</p>
                      <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0', config.badgeBg)}>
                        {config.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{alert.message}</p>
                  </div>
                  {alert.dismissible && (
                    <button
                      onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
                      className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex-shrink-0 mt-0.5"
                    >
                      <X size={12} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Expand toggle */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          {expanded ? <><ChevronUp size={12} /> Mostrar menos</> : <><ChevronDown size={12} /> Ver {visibleAlerts.length - defaultShow} insight{visibleAlerts.length - defaultShow !== 1 ? 's' : ''} más</>}
        </button>
      )}
    </div>
  )
}
