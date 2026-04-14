import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCat, formatCurrency, cn } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

/**
 * Helper: parse date string as local date (avoid timezone shift).
 * Supabase stores '2025-04-13T00:00:00Z' — new Date() converts to local.
 * We normalize by using the date parts directly.
 */
function toLocalDateStr(dateStr: string): string {
  // If the string already has time info, parse it; otherwise append noon
  if (dateStr.includes('T')) {
    return new Date(dateStr).toDateString()
  }
  // Pure date string like '2025-04-13' — parse as local
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toDateString()
}

export default function CalendarPage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [selected, setSelected] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false }).then(({ data }) => {
      if (data) setTxs(data)
      setLoading(false)
    })
  }, [profile?.id])

  // Group transactions by local date string for fast lookup
  const txByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    txs.forEach(t => {
      const key = toLocalDateStr(t.date)
      ;(map[key] = map[key] || []).push(t)
    })
    return map
  }, [txs])

  const selectedKey = selected.toDateString()
  const dayTxs = txByDate[selectedKey] || []
  const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Dates that have transactions (for calendar dots)
  const txDates = useMemo(() => new Set(Object.keys(txByDate)), [txByDate])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Calendario</h1>
        <p className="text-xs text-gray-400">
          {selected.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
        <style>{`
          .react-calendar { border: none; font-family: inherit; }
          .react-calendar__navigation button { color: var(--gray-700); font-weight: 600; }
          .dark .react-calendar__navigation button { color: var(--gray-300); }
          .react-calendar__tile { font-size: 12px; border-radius: 8px; }
          .react-calendar__tile--active { background: #059669 !important; color: white !important; }
          .react-calendar__tile--now { background: #ECFDF5 !important; }
          .dark .react-calendar__tile--now { background: #064E3B !important; }
        `}</style>
        <Calendar
          value={selected}
          onChange={(v) => setSelected(v as Date)}
          locale="es-MX"
          tileContent={({ date }) =>
            txDates.has(date.toDateString())
              ? <div className="flex justify-center gap-0.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              : null
          }
        />
      </div>

      {/* Day summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
          <p className="text-[10px] text-gray-400 uppercase">Ingresos</p>
          <p className="text-sm font-bold text-emerald-600">{formatCurrency(dayIncome, profile?.currency)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
          <p className="text-[10px] text-gray-400 uppercase">Gastos</p>
          <p className="text-sm font-bold text-red-600">{formatCurrency(dayExpense, profile?.currency)}</p>
        </div>
      </div>

      {/* Day transactions */}
      {loading
        ? <div className="text-center py-8 text-gray-300 text-xs">Cargando...</div>
        : dayTxs.length === 0
          ? <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-xs text-gray-400">Sin movimientos este día</p>
            </div>
          : <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
              {dayTxs.map(tx => {
                const cat = getCat(tx.category_id ?? undefined)
                return (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: cat.color + '15' }}>
                        {cat.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
                        <p className="text-[10px] text-gray-400">{cat.name}</p>
                      </div>
                    </div>
                    <span className={cn('text-xs font-semibold tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white')}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile?.currency)}
                    </span>
                  </div>
                )
              })}
            </div>
      }
    </motion.div>
  )
}
