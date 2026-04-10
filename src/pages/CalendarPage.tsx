import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCat, formatCurrency, cn } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function CalendarPage() {
  const { user } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [selected, setSelected] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).then(({ data }) => {
      if (data) setTxs(data)
      setLoading(false)
    })
  }, [user?.id])

  const dayTxs = txs.filter(t => new Date(t.date).toDateString() === selected.toDateString())
  const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Tile content
  const tileContent = ({ date }: { date: Date }) => {
    const dayTxs = txs.filter(t => new Date(t.date).toDateString() === date.toDateString())
    if (dayTxs.length === 0) return null
    const income = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return (
      <div className="flex gap-0.5 mt-0.5">
        {income > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
        {expense > 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-5"><h1 className="text-2xl font-extrabold text-gray-900">Calendario</h1>
        <p className="text-gray-400 text-sm">Visualiza tus movimientos por día</p></div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <Calendar
          value={selected}
          onChange={(v) => setSelected(v as Date)}
          tileContent={tileContent}
          className="!w-full !border-0 !font-inter"
          locale="es-MX"
        />
      </div>

      {loading ? <div className="text-center py-8 text-gray-300">Cargando...</div>
        : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">
                {selected.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              {dayTxs.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-semibold">{dayTxs.length} movimientos</span>
              )}
            </div>

            {dayTxs.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Ingresos</p>
                  <p className="text-base font-bold text-emerald-600">{formatCurrency(dayIncome)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Gastos</p>
                  <p className="text-base font-bold text-red-600">{formatCurrency(dayExpense)}</p>
                </div>
              </div>
            )}

            {dayTxs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-gray-400 text-sm">Sin movimientos este día</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {dayTxs.map(tx => {
                  const cat = getCat(tx.category_id)
                  return (
                    <div key={tx.id} className="flex items-center gap-3 p-3.5 hover:bg-gray-50/50">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: cat.color + '15' }}>{cat.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                        <p className="text-[11px] text-gray-400">{cat.name}</p>
                      </div>
                      <span className={cn('text-sm font-bold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
    </motion.div>
  )
}
