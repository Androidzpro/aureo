import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Target, DollarSign, Trash2, Trophy, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, playSound, cn } from '@/lib/data'
import { Button } from '@/components/ui/button'

interface Goal {
  id: string
  name: string
  target: number
  current: number
  deadline: string
  color: string
  emoji: string
  contributions: { amount: number; date: string }[]
}

const COLORS = ['#6366F1','#10B981','#F59E0B','#EC4899','#8B5CF6','#3B82F6','#EF4444','#F97316']
const EMOJIS = ['🏖️','🚗','🏠','📱','💻','🎓','✈️','🎮','👶','💍','🏥','🎸']

export default function GoalsPage() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState<Goal[]>(() => {
    if (!user?.id) return []
    const s = localStorage.getItem(`ff-goals-${user.id}`)
    return s ? JSON.parse(s) : []
  })
  const [showModal, setShowModal] = useState(false)
  const [showContribute, setShowContribute] = useState(false)
  const [selected, setSelected] = useState<Goal | null>(null)
  const [form, setForm] = useState({ name: '', target: '', current: '0', deadline: '', emoji: '🏖️' })
  const [contribForm, setContribForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] })

  const saveGoals = (g: Goal[]) => { setGoals(g); if (user?.id) localStorage.setItem(`ff-goals-${user.id}`, JSON.stringify(g)) }

  const addGoal = () => {
    if (!form.name || !form.target) return
    saveGoals([...goals, {
      id: Date.now().toString(), name: form.name, target: parseFloat(form.target),
      current: parseFloat(form.current) || 0, deadline: form.deadline,
      color: COLORS[goals.length % COLORS.length], emoji: form.emoji, contributions: [],
    }])
    playSound('success'); setShowModal(false)
    setForm({ name: '', target: '', current: '0', deadline: '', emoji: '🏖️' })
  }

  const contribute = () => {
    if (!selected || !contribForm.amount) return
    const amount = parseFloat(contribForm.amount)
    saveGoals(goals.map(g => g.id === selected.id
      ? { ...g, current: g.current + amount, contributions: [...g.contributions, { amount, date: contribForm.date }] }
      : g))
    playSound('success'); setShowContribute(false); setContribForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setSelected(null)
  }

  const deleteGoal = (id: string) => { saveGoals(goals.filter(g => g.id !== id)); playSound('delete') }

  const totalSaved = goals.reduce((s, g) => s + g.current, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-extrabold text-gray-900">Metas de Ahorro 🎯</h1>
          <p className="text-gray-400 text-sm">Planifica y alcanza tus objetivos</p></div>
        <Button onClick={() => { setShowModal(true); playSound('click') }} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
          <Plus size={16} className="mr-1" /> Nueva meta
        </Button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs mb-1">Total ahorrado</p>
              <p className="text-3xl font-black">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-100 text-xs">Meta total</p>
              <p className="text-xl font-bold">{formatCurrency(totalTarget)}</p>
              <p className="text-indigo-200 text-xs">{((totalSaved / totalTarget) * 100).toFixed(0)}% completado</p>
            </div>
          </div>
          <div className="mt-4 w-full bg-white/20 rounded-full h-2">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(totalSaved / totalTarget) * 100}%` }} transition={{ delay: 0.3, duration: 1 }}
              className="h-2 rounded-full bg-white/80" />
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
            className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold">Nueva meta</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Vacaciones a Cancún" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Monto objetivo ($)</label>
                <input type="number" value={form.target} onChange={e => setForm({...form,target:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Ahorrado actualmente ($)</label>
                <input type="number" value={form.current} onChange={e => setForm({...form,current:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha límite</label>
                <input type="date" value={form.deadline} onChange={e => setForm({...form,deadline:e.target.value})} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm({...form,emoji:e})}
                      className={cn('w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all', form.emoji === e ? 'bg-indigo-50 ring-2 ring-indigo-400' : 'bg-gray-50 hover:bg-gray-100')}>{e}</button>
                  ))}
                </div>
              </div>
              <Button onClick={addGoal} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold h-12 rounded-xl">Crear meta</Button>
            </div>
          </motion.div>
        </div>
      )}

      {showContribute && selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowContribute(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
            className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold">Aportar a {selected.emoji} {selected.name}</h3>
              <button onClick={() => setShowContribute(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400">Actual</p>
                <p className="text-3xl font-black text-indigo-600">{formatCurrency(selected.current)}</p>
                <p className="text-xs text-gray-400 mt-1">de {formatCurrency(selected.target)}</p>
              </div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Monto ($)</label>
                <input type="number" value={contribForm.amount} onChange={e => setContribForm({...contribForm,amount:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha</label>
                <input type="date" value={contribForm.date} onChange={e => setContribForm({...contribForm,date:e.target.value})} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <Button onClick={contribute} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold h-12 rounded-xl">Aportar</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Goals */}
      {goals.length === 0 ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl mb-4">🎯</motion.div>
          <p className="text-gray-400 font-medium">No tienes metas aún</p>
          <p className="text-gray-300 text-sm mt-1">Crea tu primera meta de ahorro</p>
          <Button onClick={() => setShowModal(true)} variant="outline" className="mt-4">Crear meta</Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0
            const isComplete = pct >= 100
            return (
              <motion.div key={goal.id} layout className={cn('bg-white rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md', isComplete ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100')}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: goal.color + '20' }}>
                      {isComplete ? <Trophy size={20} className="text-amber-500" /> : goal.emoji}
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-gray-900">{goal.name}</h3>
                      {goal.deadline && <p className="text-xs text-gray-400">📅 {new Date(goal.deadline).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!isComplete && <button onClick={() => { setSelected(goal); setShowContribute(true); playSound('click') }} className="p-2 hover:bg-emerald-50 rounded-xl transition-colors"><DollarSign size={16} className="text-emerald-600" /></button>}
                    <button onClick={() => deleteGoal(goal.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8 }}
                    className="h-3 rounded-full" style={{ backgroundColor: isComplete ? '#10B981' : goal.color }} />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(goal.current)}</p>
                    <p className="text-xs text-gray-400">de {formatCurrency(goal.target)}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-xl font-black', isComplete ? 'text-emerald-600' : 'text-indigo-600')}>{pct.toFixed(0)}%</p>
                    {isComplete ? <p className="text-xs text-emerald-600 font-bold flex items-center gap-1"><Sparkles size={10} /> ¡Meta alcanzada!</p>
                      : <p className="text-xs text-gray-400">Falta {formatCurrency(goal.target - goal.current)}</p>}
                  </div>
                </div>
                {/* Contributions */}
                {goal.contributions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-500 mb-2">Últimas aportaciones</p>
                    {goal.contributions.slice(-2).map((c, i) => (
                      <div key={i} className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{new Date(c.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                        <span className="font-bold text-emerald-600">+{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
