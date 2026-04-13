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

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <div className="mb-6"><h1 className="text-xl font-semibold text-[#1A1A1A] tracking-tight">Calendario</h1><p className="text-xs text-[#707070] mt-0.5">Visualiza tus movimientos por día</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-4">
          <Calendar value={selected} onChange={(v) => setSelected(v as Date)} locale="es-MX" />
        </div>
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-[0.04em] mb-1">{selected.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1"><p className="text-[10px] text-[#A0A0A0] uppercase">Ingresos</p><p className="text-sm font-medium text-emerald-600">{formatCurrency(dayIncome)}</p></div>
              <div className="flex-1"><p className="text-[10px] text-[#A0A0A0] uppercase">Gastos</p><p className="text-sm font-medium text-red-600">{formatCurrency(dayExpense)}</p></div>
            </div>
          </div>
          {loading ? <div className="text-center py-8 text-[#A0A0A0] text-xs">Cargando...</div>
            : dayTxs.length === 0 ? <div className="card p-8 text-center"><p className="text-xs text-[#707070]">Sin movimientos</p></div>
              : <div className="card overflow-hidden divide-y divide-[#F0F0F0]">
                {dayTxs.map(tx => { const cat = getCat(tx.category_id); return (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs" style={{ backgroundColor: cat.color + '12' }}>{cat.emoji}</div>
                      <div className="min-w-0"><p className="text-xs font-medium text-[#1A1A1A] truncate">{tx.description}</p><p className="text-[10px] text-[#A0A0A0]">{cat.name}</p></div>
                    </div>
                    <span className={cn('text-xs font-medium tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-[#1A1A1A]')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                  </div>
                )})}
              </div>}
        </div>
      </div>
    </motion.div>
  )
}
