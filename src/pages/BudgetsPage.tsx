import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Wallet, AlertTriangle, CheckCircle, Edit2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const defaultCategories = [
  { name: 'Alimentación', color: '#EF4444' },
  { name: 'Transporte', color: '#F59E0B' },
  { name: 'Vivienda', color: '#8B5CF6' },
  { name: 'Entretenimiento', color: '#EC4899' },
  { name: 'Salud', color: '#10B981' },
  { name: 'Educación', color: '#3B82F6' },
  { name: 'Ropa', color: '#6366F1' },
  { name: 'Servicios', color: '#64748B' },
  { name: 'Suscripciones', color: '#A855F7' },
  { name: 'Otros', color: '#78716C' },
]

export default function BudgetsPage() {
  const { user } = useAuthStore()
  const [budgets, setBudgets] = useState<any[]>([])
  const [spent, setSpent] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ category: '', amount: '' })

  useEffect(() => { loadBudgets() }, [user?.id])

  const loadBudgets = async () => {
    if (!user?.id) return
    const now = new Date()
    const [bgsRes, txsRes] = await Promise.all([
      supabase.from('budgets').select('*, categories(*)').eq('user_id', user.id).eq('month', now.getMonth() + 1).eq('year', now.getFullYear()).order('created_at', { ascending: false }),
      supabase.from('transactions').select('category_id, amount').eq('user_id', user.id).eq('type', 'expense').gte('date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    ])
    if (bgsRes.data) setBudgets(bgsRes.data)
    const spentMap: Record<string, number> = {}
    txsRes.data?.forEach((tx: any) => { spentMap[tx.category_id] = (spentMap[tx.category_id] || 0) + tx.amount })
    setSpent(spentMap)
    setLoading(false)
  }

  const addBudget = async () => {
    if (!user?.id || !form.category || !form.amount) return
    const now = new Date()
    const cat = defaultCategories.find(c => c.name === form.category)
    let { data: existing } = await supabase.from('categories').select('id').eq('name', form.category).eq('type', 'expense').single()
    if (!existing) {
      const { data: newCat } = await supabase.from('categories').insert([{ user_id: user.id, name: form.category, type: 'expense', color: cat?.color || '#6366F1', icon: 'tag' }]).select().single()
      existing = newCat
    }
    await supabase.from('budgets').upsert([{ user_id: user.id, category_id: existing.id, amount: parseFloat(form.amount), period: 'monthly', month: now.getMonth() + 1, year: now.getFullYear() }], { onConflict: 'user_id,category_id,month,year' })
    setShowModal(false)
    setForm({ category: '', amount: '' })
    loadBudgets()
  }

  const deleteBudget = async (id: string) => {
    await supabase.from('budgets').delete().eq('id', id)
    loadBudgets()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-500 text-sm mt-1">Controla tus límites de gasto por categoría</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600">
          <Plus size={16} className="mr-1.5" /> Nuevo presupuesto
        </Button>
      </div>

      {/* Summary */}
      {!loading && budgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-indigo-100 text-sm mb-1">Presupuesto total del mes</p>
            <p className="text-3xl font-bold">{formatCurrency(budgets.reduce((s, b) => s + b.amount, 0))}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-gray-400 text-sm mb-1">Gastado</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(Object.values(spent).reduce((s, v) => s + v, 0))}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-gray-400 text-sm mb-1">Disponible</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(budgets.reduce((s, b) => s + b.amount, 0) - Object.values(spent).reduce((s, v) => s + v, 0))}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nuevo presupuesto</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><Label>Categoría</Label>
                <select value={form.category} onChange={(e) => setForm({...form,category:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Selecciona...</option>
                  {defaultCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div><Label>Límite mensual ($)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({...form,amount:e.target.value})} placeholder="0.00" /></div>
              <Button onClick={addBudget} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">Guardar</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Budget list */}
      {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div>
        : budgets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 mb-2">No hay presupuestos este mes</p>
            <Button onClick={() => setShowModal(true)} variant="outline">Crea el primero</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const spentAmount = spent[budget.category_id] || 0
              const pct = budget.amount > 0 ? Math.min((spentAmount / budget.amount) * 100, 100) : 0
              const isOver = spentAmount > budget.amount
              const isWarning = pct >= 80 && !isOver
              return (
                <div key={budget.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (budget.categories?.color || '#6366F1') + '20' }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.categories?.color || '#6366F1' }} />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{budget.categories?.name || 'Categoría'}</span>
                        <p className="text-xs text-gray-400">Límite: {formatCurrency(budget.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOver && <AlertTriangle size={16} className="text-red-500" />}
                      {!isOver && pct >= 100 && <CheckCircle size={16} className="text-emerald-500" />}
                      <button onClick={() => deleteBudget(budget.id)} className="p-1 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} className="text-red-400 opacity-0 group-hover:opacity-100" /></button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                    <div className={cn('h-3 rounded-full transition-all', isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500')} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={cn('font-medium', isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-500')}>
                      {isOver ? '⚠️ Excedido por' : ''} {formatCurrency(spentAmount)} gastado
                    </span>
                    <span className="text-gray-400">{formatCurrency(Math.max(budget.amount - spentAmount, 0))} restante</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </motion.div>
  )
}
