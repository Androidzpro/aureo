import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUpRight, ArrowDownRight, Plus, Search } from 'lucide-react'
import { supabase, getCat, formatCurrency, playSound, cn } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load() }, [user?.id])
  const load = async () => {
    if (!user?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
    if (data) setTxs(data); setLoading(false)
  }

  const filtered = useMemo(() => txs.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (search) { const c = getCat(t.category_id); return !t.description.toLowerCase().includes(search.toLowerCase()) && !c.name.toLowerCase().includes(search.toLowerCase()) }
    return true
  }), [txs, search, typeFilter])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    filtered.forEach(t => { const d = new Date(t.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }); (map[d] = map[d] || []).push(t) })
    return map
  }, [filtered])

  const addTx = async () => {
    if (!user?.id || !form.amount || !form.description) return
    await supabase.from('transactions').insert([{ user_id: user.id, type: form.type, amount: parseFloat(form.amount), description: form.description, category_id: form.category_id || '', date: new Date(form.date).toISOString() }])
    setShowAdd(false); setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] }); load()
  }
  const deleteTx = async (id: string) => { await supabase.from('transactions').delete().eq('id', id); load() }

  // Check if URL has ?add=true
  useEffect(() => {
    if (window.location.search.includes('add=true')) setShowAdd(true)
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Movimientos</h1><p className="text-xs text-gray-400">{filtered.length} registros</p></div>
        <button onClick={() => setShowAdd(true)} className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/30 active:scale-90 transition-transform"><Plus size={18} className="text-white" /></button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        {(['all', 'income', 'expense'] as const).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} className={cn('px-3 py-2 rounded-xl text-[10px] font-semibold transition-all', typeFilter === f ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-400')}>{f === 'all' ? 'Todos' : f === 'income' ? '↑' : '↓'}</button>
        ))}
      </div>

      {/* List */}
      {loading ? <div className="text-center py-12 text-gray-300 text-xs">Cargando...</div>
        : filtered.length === 0 ? <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center py-10 text-center"><p className="text-2xl mb-2">📋</p><p className="text-xs text-gray-400">Sin movimientos</p></div>
          : Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">{date}</p>
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                {items.map(tx => {
                  const cat = getCat(tx.category_id)
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3 group">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: cat.color + '15' }}>{cat.emoji}</div>
                        <div className="min-w-0"><p className="text-xs font-medium text-gray-900 dark:text-white truncate">{tx.description}</p><p className="text-[10px] text-gray-400">{cat.name}</p></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-xs font-semibold tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                        <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1"><X size={12} className="text-red-400" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-[#1A1A1A] rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">Nuevo movimiento</h3><button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 space-y-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  {[{ k: 'expense', l: '💸 Gasto' }, { k: 'income', l: '💰 Ingreso' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k, category_id: '' })} className={cn('flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all', form.type === t.k ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400')}>{t.l}</button>
                  ))}
                </div>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción..." className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" />
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="w-full h-14 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 text-2xl font-black text-gray-900 dark:text-white placeholder:text-gray-300 focus:border-indigo-500" /></div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(form.type === 'expense'
                    ? [{ id: 'food', name: 'Comida', emoji: '🍔' }, { id: 'transport', name: 'Transporte', emoji: '🚗' }, { id: 'home', name: 'Vivienda', emoji: '🏠' }, { id: 'fun', name: 'Ocio', emoji: '🎮' }, { id: 'health', name: 'Salud', emoji: '💊' }, { id: 'super', name: 'Super', emoji: '🛒' }, { id: 'gas', name: 'Gasolina', emoji: '⛽' }, { id: 'other_expense', name: 'Otros', emoji: '📦' }]
                    : [{ id: 'salary', name: 'Salario', emoji: '💼' }, { id: 'freelance', name: 'Freelance', emoji: '💻' }, { id: 'business', name: 'Negocio', emoji: '🏪' }, { id: 'invest', name: 'Inversión', emoji: '📈' }, { id: 'other_income', name: 'Otros', emoji: '💰' }]
                  ).map(c => (
                    <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })} className={cn('flex flex-col items-center gap-0.5 p-2.5 rounded-xl', form.category_id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-800')}>
                      <span className="text-xl">{c.emoji}</span><span className="text-[9px] text-gray-500">{c.name}</span></button>
                  ))}
                </div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white" />
                <button onClick={addTx} className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-300/30 active:scale-[0.98] transition-all text-sm">Guardar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
