import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Target, DollarSign, Trash2, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const colors = ['#6366F1','#10B981','#F59E0B','#EC4899','#8B5CF6','#3B82F6','#EF4444','#F97316']

export default function GoalsPage() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<any>(null)
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', deadline: '' })
  const [contributeForm, setContributeForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { loadGoals() }, [user?.id])

  const loadGoals = async () => {
    if (!user?.id) return
    const { data } = await supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setGoals(data)
    setLoading(false)
  }

  const addGoal = async () => {
    if (!user?.id || !form.name || !form.target_amount) return
    await supabase.from('savings_goals').insert([{
      user_id: user.id, name: form.name, target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount) || 0,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      color: colors[goals.length % colors.length], icon: 'target', is_active: true
    }])
    setShowModal(false)
    setForm({ name: '', target_amount: '', current_amount: '0', deadline: '' })
    loadGoals()
  }

  const contribute = async () => {
    if (!selectedGoal || !contributeForm.amount) return
    const amount = parseFloat(contributeForm.amount)
    const newAmount = selectedGoal.current_amount + amount
    await supabase.from('savings_goals').update({ current_amount: newAmount, updated_at: new Date().toISOString() }).eq('id', selectedGoal.id)
    setShowContributeModal(false)
    setContributeForm({ amount: '', date: new Date().toISOString().split('T')[0] })
    setSelectedGoal(null)
    loadGoals()
  }

  const deleteGoal = async (id: string) => {
    await supabase.from('savings_goals').delete().eq('id', id)
    loadGoals()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Metas de ahorro</h1>
          <p className="text-gray-500 text-sm mt-1">Planifica y alcanza tus objetivos financieros</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600">
          <Plus size={16} className="mr-1.5" /> Nueva meta
        </Button>
      </div>

      {/* Summary */}
      {!loading && goals.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm mb-1">Total ahorrado en metas</p>
              <p className="text-3xl font-bold">{formatCurrency(goals.reduce((s,g) => s + g.current_amount, 0))}</p>
            </div>
            <Target size={40} className="text-indigo-200" />
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nueva meta de ahorro</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><Label>Nombre de la meta</Label><Input value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder="Ej: Vacaciones a Cancún" /></div>
              <div><Label>Monto objetivo ($)</Label><Input type="number" value={form.target_amount} onChange={(e) => setForm({...form,target_amount:e.target.value})} placeholder="0.00" /></div>
              <div><Label>Ahorrado actualmente ($)</Label><Input type="number" value={form.current_amount} onChange={(e) => setForm({...form,current_amount:e.target.value})} placeholder="0.00" /></div>
              <div><Label>Fecha límite (opcional)</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({...form,deadline:e.target.value})} /></div>
              <Button onClick={addGoal} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">Crear meta</Button>
            </div>
          </motion.div>
        </div>
      )}

      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Aportar a: {selectedGoal.name}</h3>
              <button onClick={() => setShowContributeModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400">Actual</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(selectedGoal.current_amount)}</p>
                <p className="text-xs text-gray-400">de {formatCurrency(selectedGoal.target_amount)}</p>
              </div>
              <div><Label>Monto a aportar ($)</Label><Input type="number" value={contributeForm.amount} onChange={(e) => setContributeForm({...contributeForm,amount:e.target.value})} placeholder="0.00" /></div>
              <div><Label>Fecha</Label><Input type="date" value={contributeForm.date} onChange={(e) => setContributeForm({...contributeForm,date:e.target.value})} /></div>
              <Button onClick={contribute} className="w-full bg-gradient-to-r from-emerald-500 to-green-600">Aportar</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Goals grid */}
      {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div>
        : goals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-2">🎯</p>
            <p className="text-gray-400 mb-4">No tienes metas aún</p>
            <Button onClick={() => setShowModal(true)} variant="outline">Crea tu primera meta</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.filter(g => g.is_active !== false).map((goal) => {
              const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
              const isComplete = pct >= 100
              return (
                <motion.div key={goal.id} layout className={cn('bg-white rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md', isComplete ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100')}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: (goal.color || '#6366F1') + '20' }}>
                        {isComplete ? <Trophy size={20} className="text-emerald-600" /> : <Target size={20} style={{ color: goal.color || '#6366F1' }} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{goal.name}</h3>
                        {goal.deadline && <p className="text-xs text-gray-400">📅 {new Date(goal.deadline).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!isComplete && (
                        <button onClick={() => { setSelectedGoal(goal); setShowContributeModal(true) }} className="p-2 hover:bg-emerald-50 rounded-lg transition-colors">
                          <DollarSign size={16} className="text-emerald-600" />
                        </button>
                      )}
                      <button onClick={() => deleteGoal(goal.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
                    <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isComplete ? '#10B981' : (goal.color || '#6366F1') }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(goal.current_amount)}</p>
                      <p className="text-xs text-gray-400">de {formatCurrency(goal.target_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-lg font-bold', isComplete ? 'text-emerald-600' : 'text-indigo-600')}>{pct.toFixed(0)}%</p>
                      {isComplete && <p className="text-xs text-emerald-600 font-medium">🎉 ¡Meta alcanzada!</p>}
                      {!isComplete && <p className="text-xs text-gray-400">Falta {formatCurrency(goal.target_amount - goal.current_amount)}</p>}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
    </motion.div>
  )
}
