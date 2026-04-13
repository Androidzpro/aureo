import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp, TrendingDown, Shield, Wallet, Target } from 'lucide-react'
import type { FlowScoreResult } from '@/lib/flowScore'
import { cn } from '@/lib/data'

interface FlowScoreCardProps {
  score: FlowScoreResult
}

const levelIcons: Record<string, string> = {
  excelente: '🌟',
  bueno: '👍',
  regular: '⚠️',
  riesgo: '🚨',
  crítico: '🔴',
}

const breakdownLabels: Record<keyof FlowScoreResult['breakdown'], { label: string; icon: React.ReactNode; max: number }> = {
  savings_score: { label: 'Tasa de ahorro', icon: <Target size={14} />, max: 25 },
  expense_ratio_score: { label: 'Control de gastos', icon: <Wallet size={14} />, max: 20 },
  debt_score: { label: 'Carga de deuda', icon: <AlertTriangle size={14} />, max: 20 },
  consistency_score: { label: 'Consistencia', icon: <TrendingUp size={14} />, max: 15 },
  trend_score: { label: 'Tendencia', icon: <TrendingDown size={14} />, max: 10 },
  emergency_score: { label: 'Fondo de emergencia', icon: <Shield size={14} />, max: 10 },
}

export function FlowScoreCard({ score }: FlowScoreCardProps) {
  const [expanded, setExpanded] = useState(false)

  const scorePercentage = (score.score / 100) * 100

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-100 dark:text-gray-800" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" strokeWidth="2"
                strokeDasharray={`${scorePercentage}, 100`}
                strokeLinecap="round"
                className="transition-all duration-1000"
                style={{ stroke: score.color }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black" style={{ color: score.color }}>{score.score}</span>
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{levelIcons[score.level]}</span>
              <p className="text-xs font-semibold text-gray-900 dark:text-white capitalize">{score.level}</p>
            </div>
            <p className="text-[10px] text-gray-400">FlowScore</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Message */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{score.message}</p>
      </div>

      {/* Expanded Breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Breakdown bars */}
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Desglose</p>
              {Object.entries(breakdownLabels).map(([key, { label, icon, max }]) => {
                const val = score.breakdown[key as keyof FlowScoreResult['breakdown']]
                const pct = (val / max) * 100
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">{icon}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
                      </div>
                      <span className="text-[10px] font-medium text-gray-400">{val}/{max}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className={cn('h-1 rounded-full transition-all',
                          pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                      />
                    </div>
                  </div>
                )
              })}

              {/* Recommendations */}
              {score.recommendations.length > 0 && (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recomendaciones</p>
                    <div className="space-y-2">
                      {score.recommendations.slice(0, 3).map((rec, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + i * 0.05 }}
                          className={cn('rounded-xl p-3 border',
                            rec.priority === 'high' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' :
                            rec.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20' :
                            'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20')}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-base mt-0.5">{rec.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white">{rec.title}</p>
                                <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded',
                                  rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                  rec.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600')}>
                                  {rec.priority === 'high' ? 'Urgente' : rec.priority === 'medium' ? 'Importante' : 'Tip'}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{rec.message}</p>
                              <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium mt-1.5">{rec.impact}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
