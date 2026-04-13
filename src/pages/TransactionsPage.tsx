import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { X, ArrowUpRight, ArrowDownRight, Plus, Search, Pencil } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, playSound, cn } from '@/lib/data'
import { ConfirmDialog, EmptyState } from '@/components/UI'
import type { Transaction } from '@/types'

export default function TransactionsPage() {
  const [searchParams] = useSearchParams()
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(searchParams.get('add') === 'true')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { load() }, [profile?.id])
  useEffect(() => { if (searchParams.get('add') === 'true') setShowAdd(true) }, [searchParams])

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false })
    if (data) setTxs(data)
    setLoading(false)
  }

  const filtered = useMemo(() => txs.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (search) {
      const c = getCat(t.category_id)
      // FIX: || instead of &&
      return t.description.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
    }
    return true
  }), [txs, search, typeFilter])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    filtered.forEach(t => {
      // FIX: include year in grouping
      const d = new Date(t.date)
      const key = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
      ;(map[key] = map[key] || []).push(t)
    })
    return map
  }, [filtered])

  const openAdd = useCallback(() => {
    setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] })
    setEditing(null)
    setShowAdd(true)
  }, [])

  const openEdit = useCallback((tx: any) => {
    setForm({ description: tx.description, amount: String(tx.amount), type: tx.type, category_id: tx.category_id || '', date: tx.date })
    setEditing(tx)
    setShowAdd(true)
  }, [])

  const saveTx = async () => {
    if (!profile?.id || !form.amount || !form.description) return
    const amount = parseFloat(form.amount)
    if (amount <= 0) return
    if (editing) {
      await supabase.from('transactions').update({ type: form.type, amount, description: form.description, category_id: form.category_id || '', date: new Date(form.date).toISOString() }).eq('id', editing.id)
    } else {
      await supabase.from('transactions').insert([{ user_id: profile.id, type: form.type, amount, description: form.description, category_id: form.category_id || '', date: new Date(form.date).toISOString() }])
    }
    setShowAdd(false); setEditing(null); setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] }); load()
  }

  const deleteTx = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    setConfirmDelete(null); load()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Movimientos</h1><p className="text-xs text-gray-400">{filtered.length} registros</p></div>
        <button onClick={openAdd} className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/30 active:scale-90 transition-transform"><Plus size={18} className="text-white" /></button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl pl-9 pr-3 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        {(['all', 'income', 'expense'] as const).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} className={cn('px-3 py-2 rounded-xl text-[10px] font-semibold transition-all', typeFilter === f ? 'bg-indigo-500 text-white shadow-md' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-400')}>{f === 'all' ? 'Todos' : f === 'income' ? '↑' : '↓'}</button>
        ))}
      </div>

      {/* List */}
      {loading ? <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="flex items-center gap-3 p-3"><div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" /><div className="flex-1"><div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-1 animate-pulse" /><div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-16 animate-pulse" /></div></div>)}</div>
        : filtered.length === 0 ? <EmptyState emoji="📋" title="Sin movimientos" message="No se encontraron transacciones" />
          : Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">{date}</p>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                {items.map(tx => {
                  const cat = getCat(tx.category_id)
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: cat.color + '15' }}>{cat.emoji}</div>
                        <div className="min-w-0"><p className="text-xs font-medium text-gray-900 dark:text-white truncate">{tx.description}</p><p className="text-[10px] text-gray-400">{cat.name}</p></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn('text-xs font-semibold tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile?.currency)}</span>
                        {/* FIX: Always visible edit/delete buttons */}
                        <button onClick={() => openEdit(tx)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Pencil size={12} className="text-gray-400" /></button>
                        <button onClick={() => setConfirmDelete(tx.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><X size={12} className="text-red-400" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => { setShowAdd(false); setEditing(null) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">{editing ? 'Editar movimiento' : 'Nuevo movimiento'}</h3><button onClick={() => { setShowAdd(false); setEditing(null) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 space-y-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  {[{ k: 'expense', l: '💸 Gasto' }, { k: 'income', l: '💰 Ingreso' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k, category_id: '' })} className={cn('flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all', form.type === t.k ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400')}>{t.l}</button>
                  ))}
                </div>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={form.type === 'expense' ? '¿En qué gastaste?' : '¿De dónde viene?'} className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="w-full h-14 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 text-2xl font-black text-gray-900 dark:text-white placeholder:text-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(form.type === 'expense'
                    ? [{ id: 'food', name: 'Comida', emoji: '🍔' }, { id: 'transport', name: 'Transporte', emoji: '🚗' }, { id: 'home', name: 'Vivienda', emoji: '🏠' }, { id: 'fun', name: 'Ocio', emoji: '🎮' }, { id: 'health', name: 'Salud', emoji: '💊' }, { id: 'super', name: 'Super', emoji: '🛒' }, { id: 'gas', name: 'Gasolina', emoji: '⛽' }, { id: 'other_expense', name: 'Otros', emoji: '📦' }]
                    : [{ id: 'salary', name: 'Salario', emoji: '💼' }, { id: 'freelance', name: 'Freelance', emoji: '💻' }, { id: 'business', name: 'Negocio', emoji: '🏪' }, { id: 'invest', name: 'Inversión', emoji: '📈' }, { id: 'other_income', name: 'Otros', emoji: '💰' }]
                  ).map(c => (
                    <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })} className={cn('flex flex-col items-center gap-0.5 p-2.5 rounded-xl', form.category_id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                      <span className="text-xl">{c.emoji}</span><span className="text-[9px] text-gray-500">{c.name}</span></button>
                  ))}
                </div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white" />
                <button onClick={saveTx} className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-300/30 active:scale-[0.98] transition-all text-sm">{editing ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete */}
      <ConfirmDialog open={!!confirmDelete} title="Eliminar movimiento" message="Esta acción no se puede deshacer" danger confirmLabel="Eliminar" onConfirm={() => confirmDelete && deleteTx(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
    </motion.div>
  )
}
