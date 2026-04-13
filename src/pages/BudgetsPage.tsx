import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, playSound, cn } from '@/lib/data'
import { ConfirmDialog, EmptyState } from '@/components/UI'

export default function BudgetsPage() {
  const { profile } = useAuthStore()
  const [budgets, setBudgets] = useState<any[]>([])
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ category_id: '', amount: '' })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [profile?.id])

  const loadAll = async () => {
    if (!profile?.id) return
    const now = new Date()
    const [bRes, tRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', profile.id).eq('month', now.getMonth() + 1).eq('year', now.getFullYear()),
      supabase.from('transactions').select('*').eq('user_id', profile.id).eq('type', 'expense').gte('date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    ])
    if (bRes.data) setBudgets(bRes.data)
    if (tRes.data) setTxs(tRes.data)
    setLoading(false)
  }

  const saveBudget = async () => {
    if (!profile?.id || !form.category_id || !form.amount) return
    const now = new Date()
    const existing = budgets.find(b => b.category_id === form.category_id)
    if (existing) {
      await supabase.from('budgets').update({ amount: parseFloat(form.amount) }).eq('id', existing.id)
    } else {
      await supabase.from('budgets').insert([{ user_id: profile.id, category_id: form.category_id, amount: parseFloat(form.amount), month: now.getMonth() + 1, year: now.getFullYear() }])
    }
    setShowModal(false); setForm({ category_id: '', amount: '' }); loadAll()
  }

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    txs.forEach(t => { map[t.category_id] = (map[t.category_id] || 0) + t.amount })
    return map
  }, [txs])

  const expenseCats = useMemo(() => {
    const cats = getCat // just use the helper
    return [
      { id: 'food', name: 'Comida', emoji: '🍔', color: '#EF4444' },
      { id: 'transport', name: 'Transporte', emoji: '🚗', color: '#F59E0B' },
      { id: 'home', name: 'Vivienda', emoji: '🏠', color: '#8B5CF6' },
      { id: 'fun', name: 'Ocio', emoji: '🎮', color: '#EC4899' },
      { id: 'health', name: 'Salud', emoji: '💊', color: '#10B981' },
      { id: 'super', name: 'Supermercado', emoji: '🛒', color: '#14B8A6' },
      { id: 'gas', name: 'Gasolina', emoji: '⛽', color: '#D97706' },
      { id: 'subs', name: 'Suscripciones', emoji: '🔄', color: '#A855F7' },
      { id: 'other_expense', name: 'Otros', emoji: '📦', color: '#78716C' },
    ]
  }, [])

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.category_id] || 0), 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Presupuestos</h1><p className="text-xs text-gray-400">Controla tus límites de gasto</p></div>
        <button onClick={() => { setForm({ category_id: '', amount: '' }); setShowModal(true) }} className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/30 active:scale-90 transition-transform"><Plus size={18} className="text-white" /></button>
      </div>

      {budgets.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] font-medium text-gray-400 uppercase">Presupuesto</p><p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(totalBudget, profile?.currency)}</p></div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] font-medium text-gray-400 uppercase">Gastado</p><p className={cn('text-base font-bold', totalSpent > totalBudget ? 'text-red-600' : 'text-emerald-600')}>{formatCurrency(totalSpent, profile?.currency)}</p></div>
        </div>
      )}

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
        : budgets.length === 0 ? <EmptyState emoji="📋" title="Sin presupuestos" message="Define límites de gasto por categoría" actionLabel="Crear presupuesto" action={() => setShowModal(true)} />
          : (
            <div className="space-y-3">
              {expenseCats.map(cat => {
                const budget = budgets.find(b => b.category_id === cat.id)
                if (!budget) return null
                const spent = spentByCategory[cat.id] || 0
                const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
                const isOver = spent > budget.amount
                const isWarning = pct >= (budget.alert_threshold || 80) && !isOver
                return (
                  <div key={cat.id} className={cn('bg-white dark:bg-gray-900 rounded-xl border p-4', isOver ? 'border-red-200 dark:border-red-800' : isWarning ? 'border-amber-200 dark:border-amber-800' : 'border-gray-100 dark:border-gray-800')}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: cat.color + '15' }}>{cat.emoji}</div>
                        <div><h3 className="text-xs font-medium text-gray-900 dark:text-white">{cat.name}</h3><p className="text-[10px] text-gray-400">Límite: {formatCurrency(budget.amount, profile?.currency)}</p></div>
                      </div>
                      <div className="flex gap-1">
                        {isOver && <AlertTriangle size={14} className="text-red-500" />}
                        <button onClick={() => { setForm({ category_id: cat.id, amount: String(budget.amount) }); setShowModal(true) }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                          <span className="text-[10px] text-gray-400">Editar</span>
                        </button>
                        <button onClick={() => setConfirmDelete(budget.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><X size={12} className="text-red-400" /></button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-2"><div className={cn('h-2 rounded-full transition-all', isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500')} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                    <div className="flex justify-between text-[10px]">
                      <span className={cn('font-medium', isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-400')}>{pct.toFixed(0)}% usado</span>
                      <span className="text-gray-400">{formatCurrency(Math.max(0, budget.amount - spent), profile?.currency)} restante</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">{form.category_id && budgets.find(b => b.category_id === form.category_id) ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 space-y-4">
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Categoría</label>
                  <div className="grid grid-cols-3 gap-2">
                    {expenseCats.map(cat => (
                      <button key={cat.id} onClick={() => setForm({ ...form, category_id: cat.id })} className={cn('flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all', form.category_id === cat.id ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                        <span>{cat.emoji}</span><span className="text-gray-600 dark:text-gray-300">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Límite mensual ($)</label><input type="number" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <button onClick={saveBudget} className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-xs">Guardar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!confirmDelete} title="Eliminar presupuesto" message="Se eliminará el límite de esta categoría" danger confirmLabel="Eliminar" onConfirm={async () => { if (confirmDelete) { await supabase.from('budgets').delete().eq('id', confirmDelete); setConfirmDelete(null); loadAll() }}} onCancel={() => setConfirmDelete(null)} />
    </motion.div>
  )
}
