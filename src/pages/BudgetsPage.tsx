import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Pencil, Trash2, AlertTriangle, Check, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, playSound, cn } from '@/lib/data'
import { ConfirmDialog, EmptyState } from '@/components/UI'

const EXPENSE_CATS = [
  { id: 'food', name: 'Comida', emoji: '🍔', color: '#EF4444' },
  { id: 'transport', name: 'Transporte', emoji: '🚗', color: '#F59E0B' },
  { id: 'home', name: 'Vivienda', emoji: '🏠', color: '#8B5CF6' },
  { id: 'fun', name: 'Ocio', emoji: '🎮', color: '#EC4899' },
  { id: 'health', name: 'Salud', emoji: '💊', color: '#10B981' },
  { id: 'edu', name: 'Educación', emoji: '📚', color: '#3B82F6' },
  { id: 'clothes', name: 'Ropa', emoji: '👕', color: '#6366F1' },
  { id: 'services', name: 'Servicios', emoji: '⚡', color: '#64748B' },
  { id: 'subs', name: 'Suscripciones', emoji: '🔄', color: '#A855F7' },
  { id: 'restaurant', name: 'Restaurantes', emoji: '☕', color: '#F97316' },
  { id: 'super', name: 'Supermercado', emoji: '🛒', color: '#14B8A6' },
  { id: 'gas', name: 'Gasolina', emoji: '⛽', color: '#D97706' },
  { id: 'beauty', name: 'Belleza', emoji: '✨', color: '#E11D48' },
  { id: 'gifts', name: 'Regalos', emoji: '🎁', color: '#7C3AED' },
  { id: 'pets', name: 'Mascotas', emoji: '🐾', color: '#D946EF' },
  { id: 'other_expense', name: 'Otros', emoji: '📦', color: '#78716C' },
]

export default function BudgetsPage() {
  const { profile } = useAuthStore()
  const [budgets, setBudgets] = useState<any[]>([])
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ category_id: '', amount: '' })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [profile?.id])

  const loadAll = async () => {
    if (!profile?.id) return
    try {
      const now = new Date()
      const [bRes, tRes] = await Promise.allSettled([
        supabase.from('budgets').select('*').eq('user_id', profile.id).eq('month', now.getMonth() + 1).eq('year', now.getFullYear()),
        supabase.from('transactions').select('*').eq('user_id', profile.id).eq('type', 'expense').gte('date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
      ])
      if (bRes.status === 'fulfilled' && bRes.value.data) setBudgets(bRes.value.data)
      if (tRes.status === 'fulfilled' && tRes.value.data) setTxs(tRes.value.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openAdd = () => {
    // Show only categories without a budget yet
    setForm({ category_id: '', amount: '' })
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (b: any) => {
    setForm({ category_id: b.category_id, amount: String(b.amount) })
    setEditing(b)
    setShowModal(true)
  }

  const saveBudget = async () => {
    if (!profile?.id || !form.category_id || !form.amount) return
    const now = new Date()
    const data = {
      user_id: profile.id,
      category_id: form.category_id,
      amount: parseFloat(form.amount),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      alert_threshold: 80,
    }
    if (editing) {
      await supabase.from('budgets').update(data).eq('id', editing.id)
    } else {
      const { error } = await supabase.from('budgets').upsert(data, { onConflict: 'user_id,category_id,month,year' })
      if (error) {
        // If table doesn't exist, show user-friendly message
        if (error.code === '42P01') {
          alert('La tabla de presupuestos aún no existe. Ejecuta el SQL en Supabase primero.')
          return
        }
      }
    }
    setShowModal(false); setEditing(null); loadAll()
  }

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    txs.forEach(t => { map[t.category_id] = (map[t.category_id] || 0) + t.amount })
    return map
  }, [txs])

  const availableCategories = useMemo(() => {
    if (editing) return EXPENSE_CATS
    const budgetedIds = new Set(budgets.map(b => b.category_id))
    return EXPENSE_CATS.filter(c => !budgetedIds.has(c.id))
  }, [budgets, editing])

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.category_id] || 0), 0)
  const overCount = budgets.filter(b => (spentByCategory[b.category_id] || 0) > b.amount).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Presupuestos</h1><p className="text-xs text-gray-400">Límites de gasto por categoría</p></div>
        <button onClick={openAdd} disabled={availableCategories.length === 0} className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/30 active:scale-90 transition-transform disabled:opacity-40">
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Presupuesto</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(totalBudget, profile?.currency)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase">Gastado</p>
            <p className={cn('text-base font-bold', totalSpent > totalBudget ? 'text-red-600' : 'text-emerald-600')}>{formatCurrency(totalSpent, profile?.currency)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase">En alerta</p>
            <p className={cn('text-base font-bold', overCount > 0 ? 'text-red-600' : 'text-emerald-600')}>{overCount}</p>
          </div>
        </div>
      )}

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
        : budgets.length === 0 ? <EmptyState emoji="📋" title="Sin presupuestos" message="Define límites de gasto por categoría para este mes" actionLabel="Crear presupuesto" action={openAdd} />
          : (
            <div className="space-y-3">
              {EXPENSE_CATS.map(cat => {
                const budget = budgets.find(b => b.category_id === cat.id)
                if (!budget) return null
                const spent = spentByCategory[cat.id] || 0
                const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
                const isOver = spent > budget.amount
                const isWarning = pct >= 80 && !isOver
                const remaining = Math.max(0, budget.amount - spent)

                return (
                  <div key={cat.id} className={cn('bg-white dark:bg-gray-900 rounded-xl border p-4 transition-all', isOver ? 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/5' : isWarning ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/5' : 'border-gray-100 dark:border-gray-800')}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: cat.color + '15' }}>{cat.emoji}</div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                          <p className="text-[10px] text-gray-400">Límite: {formatCurrency(budget.amount, profile?.currency)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(budget)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Pencil size={13} className="text-gray-400" /></button>
                        <button onClick={() => setConfirmDelete(budget.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={13} className="text-red-400" /></button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.6 }}
                        className={cn('h-2 rounded-full', isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500')}
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isOver && <AlertTriangle size={12} className="text-red-500" />}
                        {isWarning && <AlertTriangle size={12} className="text-amber-500" />}
                        <span className={cn('text-[10px] font-semibold', isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-400')}>
                          {isOver ? `Excedido por ${formatCurrency(spent - budget.amount, profile?.currency)}` : isWarning ? '⚠️ Casi agotado' : `${pct.toFixed(0)}% usado`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">Gastado: {formatCurrency(spent, profile?.currency)}</span>
                        {!isOver && <span className="text-[10px] text-emerald-500 font-medium">Resta {formatCurrency(remaining, profile?.currency)}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => { setShowModal(false); setEditing(null) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{editing ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h3>
                <button onClick={() => { setShowModal(false); setEditing(null) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-2">Categoría</label>
                  {availableCategories.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Todas las categorías tienen presupuesto</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableCategories.map(cat => (
                        <button key={cat.id} onClick={() => setForm({ ...form, category_id: cat.id })}
                          className={cn('flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all',
                            form.category_id === cat.id ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                          <span>{cat.emoji}</span><span className="text-gray-600 dark:text-gray-300">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.category_id && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-2">
                      Límite mensual ({getCat(form.category_id).emoji} {getCat(form.category_id).name})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                      <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                        placeholder="0" className="w-full h-14 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 text-2xl font-black text-gray-900 dark:text-white placeholder:text-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>
                )}
                <button onClick={saveBudget} disabled={!form.category_id || !form.amount}
                  className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-xs disabled:opacity-40 flex items-center justify-center gap-1.5">
                  <Check size={14} /> {editing ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!confirmDelete} title="Eliminar presupuesto" message="Se eliminará el límite de esta categoría" danger confirmLabel="Eliminar" onConfirm={async () => { if (confirmDelete) { await supabase.from('budgets').delete().eq('id', confirmDelete); setConfirmDelete(null); loadAll() }}} onCancel={() => setConfirmDelete(null)} />
    </motion.div>
  )
}
