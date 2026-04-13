import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCat, formatCurrency, cn } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function CalendarPage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [selected, setSelected] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false }).then(({ data }) => { if (data) setTxs(data); setLoading(false) })
  }, [profile?.id])

  const dayTxs = txs.filter(t => new Date(t.date).toDateString() === selected.toDateString())
  const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Mark days with transactions
  const txDates = new Set(txs.map(t => new Date(t.date).toDateString()))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Calendario</h1><p className="text-xs text-gray-400">Visualiza tus movimientos por día</p></div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3">
        <Calendar value={selected} onChange={(v) => setSelected(v as Date)} locale="es-MX"
          tileContent={({ date }) => txDates.has(date.toDateString()) ? <div className="flex justify-center gap-0.5 mt-0.5"><div className="w-1 h-1 rounded-full bg-indigo-500" /></div> : null} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] text-gray-400 uppercase">Ingresos</p><p className="text-sm font-bold text-emerald-600">{formatCurrency(dayIncome, profile?.currency)}</p></div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] text-gray-400 uppercase">Gastos</p><p className="text-sm font-bold text-red-600">{formatCurrency(dayExpense, profile?.currency)}</p></div>
      </div>
      {loading ? <div className="text-center py-8 text-gray-300 text-xs">Cargando...</div>
        : dayTxs.length === 0 ? <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center"><p className="text-xs text-gray-400">Sin movimientos este día</p></div>
          : <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
            {dayTxs.map(tx => { const cat = getCat(tx.category_id); return (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: cat.color + '15' }}>{cat.emoji}</div>
                  <div className="min-w-0"><p className="text-xs font-medium text-gray-900 dark:text-white truncate">{tx.description}</p><p className="text-[10px] text-gray-400">{cat.name}</p></div>
                </div>
                <span className={cn('text-xs font-semibold tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile?.currency)}</span>
              </div>
            )})}
          </div>}
    </motion.div>
  )
}
