import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Target, DollarSign, Trash2, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, playSound, cn } from '@/lib/data'

interface Goal { id: string; name: string; target: number; current: number; emoji: string; color: string; deadline: string; contributions: { amount: number; date: string }[] }
const COLORS = ['#6366F1','#10B981','#F59E0B','#EC4899','#8B5CF6','#3B82F6','#EF4444','#F97316']

export default function GoalsPage() {
  const { profile } = useAuthStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showContrib, setShowContrib] = useState(false)
  const [selected, setSelected] = useState<Goal | null>(null)
  const [form, setForm] = useState({ name: '', target: '', current: '0', emoji: '🎯' })
  const [cForm, setCForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { if (profile?.id) { const s = localStorage.getItem(`ff-goals-${profile.id}`); if (s) setGoals(JSON.parse(s)) } }, [profile?.id])

  const save = (g: Goal[]) => { setGoals(g); if (profile?.id) localStorage.setItem(`ff-goals-${profile.id}`, JSON.stringify(g)) }
  const addGoal = () => { if (!form.name || !form.target) return; save([...goals, { id: Date.now().toString(), name: form.name, target: parseFloat(form.target), current: parseFloat(form.current) || 0, emoji: form.emoji, color: COLORS[goals.length % COLORS.length], deadline: '', contributions: [] }]); playSound('success'); setShowModal(false); setForm({ name: '', target: '', current: '0', emoji: '🎯' }) }
  const contribute = () => { if (!selected || !cForm.amount) return; const a = parseFloat(cForm.amount); save(goals.map(g => g.id === selected.id ? { ...g, current: g.current + a, contributions: [...g.contributions, { amount: a, date: cForm.date }] } : g)); playSound('success'); setShowContrib(false); setCForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setSelected(null) }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-extrabold text-gray-900">Metas de Ahorro 🎯</h1><p className="text-gray-400 text-sm">Planifica y alcanza tus objetivos</p></div>
        <button onClick={() => { setShowModal(true); playSound('click') }} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold h-10 px-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-1"><Plus size={16} /> Nueva</button>
      </div>

      {goals.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white mb-5 shadow-lg">
          <div className="flex justify-between"><div><p className="text-indigo-100 text-xs">Total ahorrado</p><p className="text-2xl font-black">{formatCurrency(goals.reduce((s,g) => s + g.current, 0))}</p></div><div className="text-right"><p className="text-indigo-100 text-xs">Meta total</p><p className="text-lg font-bold">{formatCurrency(goals.reduce((s,g) => s + g.target, 0))}</p></div></div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100"><h3 className="text-lg font-bold">Nueva meta</h3><button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Nombre</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Vacaciones" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Monto objetivo ($)</label><input type="number" value={form.target} onChange={e => setForm({...form,target:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Ahorrado ($)</label><input type="number" value={form.current} onChange={e => setForm({...form,current:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {['🏖️','🚗','🏠','📱','💻','🎓','✈️','🎮','👶','💍','🏥','🎸'].map(e => (
                    <button key={e} onClick={() => setForm({...form,emoji:e})} className={cn('w-10 h-10 rounded-xl text-xl', form.emoji === e ? 'bg-indigo-50 ring-2 ring-indigo-400' : 'bg-gray-50')}>{e}</button>
                  ))}
                </div>
              </div>
              <button onClick={addGoal} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold h-12 rounded-xl">Crear meta</button>
            </div>
          </motion.div>
        </div>
      )}

      {showContrib && selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowContrib(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100"><h3 className="text-lg font-bold">Aportar a {selected.emoji} {selected.name}</h3><button onClick={() => setShowContrib(false)}><X size={18} className="text-gray-400" /></button></div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-xs text-gray-400">Actual</p><p className="text-2xl font-bold text-indigo-600">{formatCurrency(selected.current)}</p><p className="text-xs text-gray-400">de {formatCurrency(selected.target)}</p></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Monto ($)</label><input type="number" value={cForm.amount} onChange={e => setCForm({...cForm,amount:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha</label><input type="date" value={cForm.date} onChange={e => setCForm({...cForm,date:e.target.value})} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <button onClick={contribute} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold h-12 rounded-xl">Aportar</button>
            </div>
          </motion.div>
        </div>
      )}

      {goals.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-gray-100"><p className="text-4xl mb-2">🎯</p><p className="text-gray-400">Sin metas aún</p><button onClick={() => setShowModal(true)} className="mt-3 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold">Crear meta</button></div>
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => {
            const pct = g.target > 0 ? (g.current / g.target) * 100 : 0; const done = pct >= 100
            return (
              <div key={g.id} className={cn('bg-white rounded-xl border p-5 shadow-sm', done ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100')}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: g.color + '20' }}>{done ? <Trophy size={20} className="text-amber-500" /> : g.emoji}</div>
                    <div><h3 className="font-bold text-gray-900">{g.name}</h3></div>
                  </div>
                  <div className="flex gap-1">
                    {!done && <button onClick={() => { setSelected(g); setShowContrib(true); playSound('click') }} className="p-2 hover:bg-emerald-50 rounded-lg"><DollarSign size={16} className="text-emerald-600" /></button>}
                    <button onClick={() => { save(goals.filter(x => x.id !== g.id)); playSound('delete') }} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-3"><div className="h-3 rounded-full" style={{ width: `${Math.min(pct,100)}%`, backgroundColor: done ? '#10B981' : g.color }} /></div>
                <div className="flex justify-between items-end">
                  <div><p className="text-sm font-bold text-gray-900">{formatCurrency(g.current)}</p><p className="text-xs text-gray-400">de {formatCurrency(g.target)}</p></div>
                  <div className="text-right"><p className={cn('text-xl font-black', done ? 'text-emerald-600' : 'text-indigo-600')}>{pct.toFixed(0)}%</p>
                    {done ? <p className="text-xs text-emerald-600 font-bold">🎉 ¡Meta alcanzada!</p> : <p className="text-xs text-gray-400">Falta {formatCurrency(g.target - g.current)}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>}
    </motion.div>
  )
}
