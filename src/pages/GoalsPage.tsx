import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function GoalsPage() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0' })

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
      user_id: user.id, name: form.name,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount) || 0,
      color: '#6366F1', icon: 'target', is_active: true
    }])
    setShowModal(false)
    setForm({ name: '', target_amount: '', current_amount: '0' })
    loadGoals()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Metas de ahorro</h1>
          <p className="text-gray-500 text-sm mt-1">Planifica tus objetivos financieros</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600">
          <Plus size={16} className="mr-1.5" /> Nueva meta
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nueva meta de ahorro</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><Label>Nombre de la meta</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Vacaciones" /></div>
              <div><Label>Monto objetivo ($)</Label><Input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} placeholder="0.00" /></div>
              <div><Label>Ahorrado actualmente ($)</Label><Input type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} placeholder="0.00" /></div>
              <Button onClick={addGoal} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">Guardar</Button>
            </div>
          </motion.div>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div>
        : goals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 mb-2">No tienes metas aún</p>
            <Button onClick={() => setShowModal(true)} variant="outline">Crea la primera</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.filter(g => g.is_active).map((goal) => {
              const pct = (goal.current_amount / goal.target_amount) * 100
              return (
                <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Target size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{goal.name}</h3>
                      <p className="text-xs text-gray-400">{formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-right">{pct.toFixed(1)}%</p>
                </div>
              )
            })}
          </div>
        )}
    </motion.div>
  )
}
