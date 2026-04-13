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
    supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false }).then(({ data }) => {
      if (data) setTxs(data); setLoading(false)
    })
  }, [profile?.id])

  const dayTxs = txs.filter(t => new Date(t.date).toDateString() === selected.toDateString())
  const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-5"><h1 className="text-2xl font-extrabold text-gray-900">Calendario 📅</h1><p className="text-gray-400 text-sm">Visualiza tus movimientos por día</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <Calendar value={selected} onChange={(v) => setSelected(v as Date)} locale="es-MX" className="!w-full !border-0" />
      </div>
      {loading ? <div className="text-center py-8 text-gray-300">Cargando...</div> : (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">{selected.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
          {dayTxs.length === 0 ? <div className="text-center py-12 bg-white rounded-2xl border border-gray-100"><p className="text-gray-400">Sin movimientos este día</p></div>
            : <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"><p className="text-[10px] text-gray-400 uppercase">Ingresos</p><p className="text-base font-bold text-emerald-600">{formatCurrency(dayIncome)}</p></div>
                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"><p className="text-[10px] text-gray-400 uppercase">Gastos</p><p className="text-base font-bold text-red-600">{formatCurrency(dayExpense)}</p></div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {dayTxs.map(tx => { const cat = getCat(tx.category_id); return (
                  <div key={tx.id} className="flex items-center gap-3 p-3.5">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: cat.color + '15' }}>{cat.icon}</div>
                    <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{tx.description}</p><p className="text-[11px] text-gray-400">{cat.name}</p></div>
                    <span className={cn('text-sm font-bold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                  </div>
                )})}
              </div>
            </div>}
        </div>
      )}
    </motion.div>
  )
}
