import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase, getCat as getCat, formatCurrency, formatDate, playSound, cn, CATS } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load() }, [user?.id])
  const load = async () => {
    if (!user?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
    if (data) setTxs(data)
    setLoading(false)
  }

  const filtered = useMemo(() => txs.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (search) { const c = getCat(t.category_id); return !t.description.toLowerCase().includes(search.toLowerCase()) && !c.name.toLowerCase().includes(search.toLowerCase()) }
    return true
  }), [txs, search, typeFilter])

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    filtered.forEach(t => { const d = new Date(t.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); (map[d] = map[d] || []).push(t) })
    return map
  }, [filtered])

  const totals = useMemo(() => ({
    income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }), [filtered])

  const addTx = async () => {
    if (!user?.id || !form.amount || !form.description) return
    await supabase.from('transactions').insert([{ user_id: user.id, type: form.type, amount: parseFloat(form.amount), description: form.description, category_id: form.category_id || '', date: new Date(form.date).toISOString() }])
    sounds.success(); setShowModal(false); setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] }); load()
  }

  const deleteTx = async (id: string) => { await supabase.from('transactions').delete().eq('id', id); sounds.delete(); load() }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-extrabold text-gray-900">Movimientos</h1>
          <p className="text-gray-400 text-sm">{filtered.length} transacciones</p></div>
        <Button onClick={() => { setShowModal(true); sounds.click() }} className="gradient-primary text-white font-semibold shadow-lg shadow-indigo-200"><Plus size={16} className="mr-1" /> Nuevo</Button>
      </div>

      {/* Summary + filters */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"><p className="text-[10px] text-gray-400 uppercase font-semibold">Ingresos</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(totals.income)}</p></div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"><p className="text-[10px] text-gray-400 uppercase font-semibold">Gastos</p><p className="text-lg font-bold text-red-600">{formatCurrency(totals.expense)}</p></div>
      </div>
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full h-10 rounded-xl border border-gray-200 pl-9 pr-3 text-sm" /></div>
        {(['all', 'income', 'expense'] as const).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)}
            className={cn('px-3 py-2 rounded-xl text-xs font-semibold transition-all', typeFilter === f ? 'gradient-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500')}>
            {f === 'all' ? 'Todos' : f === 'income' ? 'Ingresos' : 'Gastos'}</button>
        ))}
      </div>

      {/* Grouped list */}
      {loading ? <div className="text-center py-12 text-gray-300">Cargando...</div>
        : filtered.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-gray-100"><p className="text-gray-400">No hay movimientos</p></div>
          : Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{date}</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {items.map(tx => {
                  const cat = getCat(tx.category_id)
                  return (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: cat.color + '15' }}>{cat.icon}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                          <p className="text-[11px] text-gray-400">{cat.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-bold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                        <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg"><X size={14} className="text-red-400" /></button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-100">
                <h3 className="text-lg font-bold">Nuevo movimiento</h3>
                <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                  {[{ k: 'expense', l: '💸 Gasto', c: 'bg-red-500 text-white' }, { k: 'income', l: '💰 Ingreso', c: 'bg-emerald-500 text-white' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k })}
                      className={cn('flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all', form.type === t.k ? t.c : 'text-gray-500')}>{t.l}</button>
                  ))}
                </div>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción..." className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm" />
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full h-12 rounded-xl border border-gray-200 pl-8 pr-4 text-lg font-bold" /></div>
                <div className="grid grid-cols-4 gap-2">
                  {(form.type === 'expense' ? CATS.expenses : CATS.incomes).slice(0, 8).map(c => (
                    <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })}
                      className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all', form.category_id === c.id ? 'bg-indigo-50 ring-2 ring-indigo-400' : 'bg-gray-50')}>
                      <span className="text-xl">{c.icon}</span><span className="text-[10px] text-gray-600">{c.name}</span></button>
                  ))}
                </div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm" />
                <Button onClick={addTx} className="w-full gradient-primary text-white font-bold h-12 rounded-xl shadow-lg">Guardar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
