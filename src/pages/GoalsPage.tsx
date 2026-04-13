import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, DollarSign, Trash2, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, playSound, cn } from '@/lib/data'

interface Goal { id: string; name: string; target: number; current: number; emoji: string; color: string; contributions: { amount: number; date: string }[] }
const COLORS = ['#6366F1','#10B981','#F59E0B','#EC4899','#8B5CF6','#3B82F6']

export default function GoalsPage() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showContrib, setShowContrib] = useState(false)
  const [selected, setSelected] = useState<Goal | null>(null)
  const [form, setForm] = useState({ name: '', target: '', current: '0', emoji: '🎯' })
  const [cForm, setCForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { if (user?.id) { const s = localStorage.getItem(`ff-goals-${user.id}`); if (s) setGoals(JSON.parse(s)) } }, [user?.id])
  const save = (g: Goal[]) => { setGoals(g); if (user?.id) localStorage.setItem(`ff-goals-${user.id}`, JSON.stringify(g)) }
  const addGoal = () => { if (!form.name || !form.target) return; save([...goals, { id: Date.now().toString(), name: form.name, target: parseFloat(form.target), current: parseFloat(form.current) || 0, emoji: form.emoji, color: COLORS[goals.length % COLORS.length], contributions: [] }]); setShowModal(false); setForm({ name: '', target: '', current: '0', emoji: '🎯' }) }
  const contribute = () => { if (!selected || !cForm.amount) return; const a = parseFloat(cForm.amount); save(goals.map(g => g.id === selected.id ? { ...g, current: g.current + a, contributions: [...g.contributions, { amount: a, date: cForm.date }] } : g)); setShowContrib(false); setCForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setSelected(null) }

  const Modal = ({ show, onClose, title, children }: any) => (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={onClose}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-[#1A1A1A] rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3><button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
            <div className="p-5 space-y-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Metas de Ahorro</h1><p className="text-xs text-gray-400">Planifica y alcanza tus objetivos</p></div>
        <button onClick={() => { setShowModal(true); playSound('click') }} className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/30 active:scale-90 transition-transform"><Plus size={18} className="text-white" /></button>
      </div>

      {goals.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
          <p className="text-white/60 text-[10px] uppercase">Total ahorrado</p>
          <p className="text-xl font-bold">{formatCurrency(goals.reduce((s,g) => s + g.current, 0))}<span className="text-sm font-normal text-white/60 ml-1">de {formatCurrency(goals.reduce((s,g) => s + g.target, 0))}</span></p>
        </div>
      )}

      {goals.length === 0 ? <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center py-10 text-center"><p className="text-2xl mb-2">🎯</p><p className="text-xs text-gray-400 mb-3">Sin metas aún</p><button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl">Crear meta</button></div>
        : goals.map(g => {
          const pct = g.target > 0 ? (g.current / g.target) * 100 : 0; const done = pct >= 100
          return (
            <div key={g.id} className={cn('bg-white dark:bg-[#1A1A1A] rounded-xl border p-4', done ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-100 dark:border-gray-800')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: g.color + '15' }}>{done ? <Trophy size={14} className="text-amber-500" /> : g.emoji}</div>
                  <div><h3 className="text-xs font-medium text-gray-900 dark:text-white">{g.name}</h3></div>
                </div>
                <div className="flex gap-1">
                  {!done && <button onClick={() => { setSelected(g); setShowContrib(true) }} className="btn-secondary px-2 py-1.5 text-[10px]">Aportar</button>}
                  <button onClick={() => { save(goals.filter(x => x.id !== g.id)) }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2"><div className="h-1.5 rounded-full" style={{ width: `${Math.min(pct,100)}%`, backgroundColor: done ? '#10B981' : g.color }} /></div>
              <div className="flex justify-between items-end">
                <div><p className="text-xs font-medium text-gray-900 dark:text-white">{formatCurrency(g.current)}</p><p className="text-[10px] text-gray-400">de {formatCurrency(g.target)}</p></div>
                <div className="text-right"><p className={cn('text-sm font-bold', done ? 'text-emerald-600' : 'text-gray-900 dark:text-white')}>{pct.toFixed(0)}%</p>{done ? <p className="text-[10px] text-emerald-600 font-medium">🎉 ¡Meta alcanzada!</p> : <p className="text-[10px] text-gray-400">Falta {formatCurrency(g.target - g.current)}</p>}</div>
              </div>
            </div>
          )
        })}

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Nueva meta">
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Nombre</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Vacaciones" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Monto objetivo ($)</label><input type="number" value={form.target} onChange={e => setForm({...form,target:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Ahorrado ($)</label><input type="number" value={form.current} onChange={e => setForm({...form,current:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-2">Emoji</label>
          <div className="flex gap-1.5 flex-wrap">{['🏖️','🚗','🏠','📱','💻','🎓','✈️','🎮','👶','💍'].map(e => (
            <button key={e} onClick={() => setForm({...form,emoji:e})} className={cn('w-9 h-9 rounded-lg text-lg', form.emoji === e ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-800')}>{e}</button>
          ))}</div>
        </div>
        <div className="flex gap-2"><button onClick={() => setShowModal(false)} className="flex-1 h-11 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs">Cancelar</button><button onClick={addGoal} className="flex-1 h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-xs">Crear</button></div>
      </Modal>

      <Modal show={showContrib && !!selected} onClose={() => setShowContrib(false)} title={`Aportar a ${selected?.emoji} ${selected?.name}`}>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center"><p className="text-[10px] text-gray-400">Actual</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(selected?.current || 0)}</p></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Monto ($)</label><input type="number" value={cForm.amount} onChange={e => setCForm({...cForm,amount:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Fecha</label><input type="date" value={cForm.date} onChange={e => setCForm({...cForm,date:e.target.value})} className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white" /></div>
        <button onClick={contribute} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl text-xs">Aportar</button>
      </Modal>
    </motion.div>
  )
}
