import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase, getCat, formatCurrency, formatDate, cn } from '@/lib/data'
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

  const addTx = async () => {
    if (!profile?.id || !form.amount || !form.description) return
    await supabase.from('transactions').insert([{ user_id: profile.id, type: form.type, amount: parseFloat(form.amount), description: form.description, category_id: form.category_id || '', date: new Date(form.date).toISOString() }])
    setShowModal(false); setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] }); load()
  }
  const deleteTx = async (id: string) => { await supabase.from('transactions').delete().eq('id', id); load() }

  const totals = useMemo(() => ({
    income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    count: filtered.length
  }), [filtered])

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Movimientos</h1><p className="page-subtitle">{totals.count} transacciones</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Nuevo</button>
      </div>

      {/* Summary + Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium"><ArrowUpRight size={12} />{formatCurrency(totals.income)}</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium"><ArrowDownRight size={12} />{formatCurrency(totals.expense)}</div>
        </div>
        <div className="flex-1" />
        <div className="relative w-48">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input pl-8" />
        </div>
        <div className="flex gap-0.5 bg-[#F5F5F5] rounded-md p-0.5">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-all', typeFilter === f ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#707070]')}>
              {f === 'all' ? 'Todos' : f === 'income' ? 'Ingresos' : 'Gastos'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? <div className="text-center py-12 text-[#A0A0A0] text-sm">Cargando...</div>
        : filtered.length === 0 ? <div className="card empty-state"><p className="text-sm text-[#707070]">Sin movimientos</p></div>
          : Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-6">
              <p className="text-xs font-medium text-[#A0A0A0] mb-2 px-1">{date}</p>
              <div className="card overflow-hidden">
                {items.map(tx => {
                  const cat = getCat(tx.category_id)
                  return (
                    <div key={tx.id} className="table-row group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm" style={{ backgroundColor: cat.color + '12' }}>{cat.icon}</div>
                        <div className="min-w-0"><p className="text-sm font-medium text-[#1A1A1A] truncate">{tx.description}</p><p className="text-xs text-[#A0A0A0]">{cat.name}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-[#1A1A1A]')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                        <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"><X size={14} className="text-red-400" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-lg w-full lg:max-w-md shadow-xl border border-[#EAEAEA]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#EAEAEA]">
                <h3 className="text-sm font-medium text-[#1A1A1A]">Nuevo movimiento</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#F5F5F5] rounded"><X size={14} className="text-[#707070]" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-1 bg-[#F5F5F5] rounded-md p-0.5">
                  {[{ k: 'expense', l: 'Gasto' }, { k: 'income', l: 'Ingreso' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k, category_id: '' })}
                      className={cn('flex-1 py-1.5 rounded text-xs font-medium transition-all', form.type === t.k ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#707070]')}>{t.l}</button>
                  ))}
                </div>
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Descripción</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción..." className="input" /></div>
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Monto</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-sm">$</span><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="input pl-7 font-medium" /></div></div>
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-2 block">Categoría</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(form.type === 'expense'
                      ? [{ id: 'food', name: 'Comida', icon: '🍔' }, { id: 'transport', name: 'Transporte', icon: '🚗' }, { id: 'home', name: 'Vivienda', icon: '🏠' }, { id: 'fun', name: 'Ocio', icon: '🎮' }, { id: 'health', name: 'Salud', icon: '💊' }, { id: 'super', name: 'Super', icon: '🛒' }, { id: 'gas', name: 'Gas', icon: '⛽' }, { id: 'other_expense', name: 'Otros', icon: '📦' }]
                      : [{ id: 'salary', name: 'Salario', icon: '💼' }, { id: 'freelance', name: 'Freelance', icon: '💻' }, { id: 'business', name: 'Negocio', icon: '🏪' }, { id: 'invest', name: 'Inversión', icon: '📈' }, { id: 'other_income', name: 'Otros', icon: '💰' }]
                    ).map(c => (
                      <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })} className={cn('flex flex-col items-center gap-0.5 p-2 rounded-md text-xs transition-all', form.category_id === c.id ? 'bg-[#F0F0F0] text-[#1A1A1A] font-medium' : 'bg-white hover:bg-[#F5F5F5] text-[#5C5C5C]')}>
                        <span className="text-base">{c.icon}</span><span className="text-[10px]">{c.name}</span></button>
                    ))}
                  </div>
                </div>
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Fecha</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" /></div>
                <div className="flex gap-2 pt-2"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={addTx} className="btn-primary flex-1">Guardar</button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
