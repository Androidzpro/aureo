import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase, getCat, formatCurrency, playSound, cn } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'

export default function TransactionsPage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load() }, [profile?.id])
  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false })
    if (data) setTxs(data); setLoading(false)
  }

  const filtered = useMemo(() => txs.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (search) { const c = getCat(t.category_id); return !t.description.toLowerCase().includes(search.toLowerCase()) && !c.name.toLowerCase().includes(search.toLowerCase()) }
    return true
  }), [txs, search, typeFilter])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    filtered.forEach(t => { const d = new Date(t.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); (map[d] = map[d] || []).push(t) })
    return map
  }, [filtered])

  const totals = useMemo(() => ({
    income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    count: filtered.length
  }), [filtered])

  const addTx = async () => {
    if (!profile?.id || !form.amount || !form.description) return
    await supabase.from('transactions').insert([{ user_id: profile.id, type: form.type, amount: parseFloat(form.amount), description: form.description, category_id: form.category_id || '', date: new Date(form.date).toISOString() }])
    setShowModal(false); setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] }); load()
  }
  const deleteTx = async (id: string) => { await supabase.from('transactions').delete().eq('id', id); load() }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-[#1A1A1A] tracking-tight">Movimientos</h1><p className="text-xs text-[#707070] mt-0.5">{totals.count} transacciones</p></div>
        <button onClick={() => { setShowModal(true); playSound('click') }} className="btn-primary flex items-center gap-1.5"><Plus size={14} /> Nuevo</button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium"><ArrowUpRight size={12} />{formatCurrency(totals.income)}</div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium"><ArrowDownRight size={12} />{formatCurrency(totals.expense)}</div>
        <div className="flex-1" />
        <div className="relative w-40">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input pl-7" />
        </div>
        <div className="flex gap-0.5 bg-[#F5F5F5] rounded-md p-0.5">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button key={f} onClick={() => { setTypeFilter(f); playSound('click') }}
              className={cn('px-2 py-1 rounded text-[10px] font-medium transition-all', typeFilter === f ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#707070]')}>
              {f === 'all' ? 'Todos' : f === 'income' ? 'Ingresos' : 'Gastos'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-[#A0A0A0] text-sm">Cargando...</div>
        : filtered.length === 0 ? <div className="card flex flex-col items-center py-12 text-center"><p className="text-xs text-[#707070]">Sin movimientos</p></div>
          : Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-5">
              <p className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-[0.04em] mb-2 px-1">{date}</p>
              <div className="card overflow-hidden divide-y divide-[#F0F0F0]">
                {items.map(tx => {
                  const cat = getCat(tx.category_id)
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FAFAFA] transition-colors group">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: cat.color + '12' }}>{cat.emoji}</div>
                        <div className="min-w-0"><p className="text-xs font-medium text-[#1A1A1A] truncate">{tx.description}</p><p className="text-[10px] text-[#A0A0A0]">{cat.name}</p></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-xs font-medium tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-[#1A1A1A]')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                        <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"><X size={12} className="text-red-400" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-white rounded-xl w-full lg:max-w-md shadow-2xl border border-[#EAEAEA] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA]"><h3 className="text-sm font-medium text-[#1A1A1A]">Nuevo movimiento</h3><button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[#F5F5F5] rounded-md"><X size={14} className="text-[#707070]" /></button></div>
              <div className="p-4 space-y-4">
                <div className="flex gap-1 bg-[#F5F5F5] rounded-md p-0.5">
                  {[{ k: 'expense', l: '💸 Gasto' }, { k: 'income', l: '💰 Ingreso' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k, category_id: '' })} className={cn('flex-1 py-2 rounded text-xs font-medium transition-all', form.type === t.k ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#707070]')}>{t.l}</button>
                  ))}
                </div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Descripción</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción..." className="input" /></div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Monto</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-sm">$</span><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="input pl-7 font-medium" /></div></div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-2 block">Categoría</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(form.type === 'expense'
                      ? [{ id: 'food', name: 'Comida', emoji: '🍔' }, { id: 'transport', name: 'Transporte', emoji: '🚗' }, { id: 'home', name: 'Vivienda', emoji: '🏠' }, { id: 'fun', name: 'Ocio', emoji: '🎮' }, { id: 'health', name: 'Salud', emoji: '💊' }, { id: 'super', name: 'Super', emoji: '🛒' }, { id: 'gas', name: 'Gasolina', emoji: '⛽' }, { id: 'other_expense', name: 'Otros', emoji: '📦' }]
                      : [{ id: 'salary', name: 'Salario', emoji: '💼' }, { id: 'freelance', name: 'Freelance', emoji: '💻' }, { id: 'business', name: 'Negocio', emoji: '🏪' }, { id: 'invest', name: 'Inversión', emoji: '📈' }, { id: 'other_income', name: 'Otros', emoji: '💰' }]
                    ).map(c => (
                      <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })} className={cn('flex flex-col items-center gap-0.5 p-2 rounded-md text-xs transition-all', form.category_id === c.id ? 'bg-[#F0F0F0] text-[#1A1A1A] font-medium' : 'bg-white hover:bg-[#F5F5F5] text-[#5C5C5C]')}>
                        <span className="text-base">{c.emoji}</span><span className="text-[9px]">{c.name}</span></button>
                    ))}
                  </div>
                </div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Fecha</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" /></div>
                <div className="flex gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-xs">Cancelar</button><button onClick={addTx} className="btn-primary flex-1 text-xs">Guardar</button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
