import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, DollarSign, Trash2, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, playSound, cn } from '@/lib/data'

interface Goal { id: string; name: string; target: number; current: number; emoji: string; color: string; contributions: { amount: number; date: string }[] }
const COLORS = ['#6366F1','#10B981','#F59E0B','#EC4899','#8B5CF6','#3B82F6']

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
  const addGoal = () => { if (!form.name || !form.target) return; save([...goals, { id: Date.now().toString(), name: form.name, target: parseFloat(form.target), current: parseFloat(form.current) || 0, emoji: form.emoji, color: COLORS[goals.length % COLORS.length], contributions: [] }]); setShowModal(false); setForm({ name: '', target: '', current: '0', emoji: '🎯' }) }
  const contribute = () => { if (!selected || !cForm.amount) return; const a = parseFloat(cForm.amount); save(goals.map(g => g.id === selected.id ? { ...g, current: g.current + a, contributions: [...g.contributions, { amount: a, date: cForm.date }] } : g)); setShowContrib(false); setCForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setSelected(null) }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-[#1A1A1A] tracking-tight">Metas de Ahorro</h1><p className="text-xs text-[#707070] mt-0.5">Planifica y alcanza tus objetivos</p></div>
        <button onClick={() => { setShowModal(true); playSound('click') }} className="btn-primary flex items-center gap-1.5"><Plus size={14} /> Nueva</button>
      </div>

      {goals.length > 0 && (
        <div className="card p-4 mb-6"><p className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-[0.04em] mb-1">Total ahorrado</p><p className="text-lg font-semibold text-[#1A1A1A]">{formatCurrency(goals.reduce((s,g) => s + g.current, 0))}<span className="text-xs font-normal text-[#A0A0A0] ml-2">de {formatCurrency(goals.reduce((s,g) => s + g.target, 0))}</span></p></div>
      )}

      {goals.length === 0 ? <div className="card flex flex-col items-center py-12 text-center"><p className="text-2xl mb-2">🎯</p><p className="text-xs text-[#707070] mb-3">Sin metas aún</p><button onClick={() => setShowModal(true)} className="btn-primary">Crear meta</button></div>
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => {
            const pct = g.target > 0 ? (g.current / g.target) * 100 : 0; const done = pct >= 100
            return (
              <div key={g.id} className={cn('card p-4', done ? 'border-emerald-200 bg-emerald-50/30' : '')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm" style={{ backgroundColor: g.color + '15' }}>{done ? <Trophy size={14} className="text-amber-500" /> : g.emoji}</div>
                    <div><h3 className="text-xs font-medium text-[#1A1A1A]">{g.name}</h3></div>
                  </div>
                  <div className="flex gap-1">
                    {!done && <button onClick={() => { setSelected(g); setShowContrib(true); playSound('click') }} className="btn-secondary px-2 py-1 text-[10px]">Aportar</button>}
                    <button onClick={() => { save(goals.filter(x => x.id !== g.id)); playSound('delete') }} className="p-1.5 hover:bg-red-50 rounded-md"><Trash2 size={14} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="w-full bg-[#F0F0F0] rounded-full h-1.5 mb-2"><div className="h-1.5 rounded-full" style={{ width: `${Math.min(pct,100)}%`, backgroundColor: done ? '#10B981' : g.color }} /></div>
                <div className="flex justify-between items-end">
                  <div><p className="text-xs font-medium text-[#1A1A1A]">{formatCurrency(g.current)}</p><p className="text-[10px] text-[#A0A0A0]">de {formatCurrency(g.target)}</p></div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', done ? 'text-emerald-600' : 'text-[#1A1A1A]')}>{pct.toFixed(0)}%</p>
                    {done ? <p className="text-[10px] text-emerald-600 font-medium">🎉 ¡Meta alcanzada!</p> : <p className="text-[10px] text-[#A0A0A0]">Falta {formatCurrency(g.target - g.current)}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-white rounded-xl w-full lg:max-w-md shadow-2xl border border-[#EAEAEA]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA]"><h3 className="text-sm font-medium">Nueva meta</h3><button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[#F5F5F5] rounded-md"><X size={14} className="text-[#707070]" /></button></div>
              <div className="p-4 space-y-4">
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Nombre</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Vacaciones" className="input" /></div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Monto objetivo ($)</label><input type="number" value={form.target} onChange={e => setForm({...form,target:e.target.value})} placeholder="0" className="input" /></div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Ahorrado ($)</label><input type="number" value={form.current} onChange={e => setForm({...form,current:e.target.value})} placeholder="0" className="input" /></div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-2 block">Emoji</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {['🏖️','🚗','🏠','📱','💻','🎓','✈️','🎮','👶','💍'].map(e => (
                      <button key={e} onClick={() => setForm({...form,emoji:e})} className={cn('w-8 h-8 rounded-md text-lg', form.emoji === e ? 'bg-[#F0F0F0]' : 'bg-[#FAFAFA] hover:bg-[#F5F5F5]')}>{e}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-xs">Cancelar</button><button onClick={addGoal} className="btn-primary flex-1 text-xs">Crear</button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showContrib && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-end lg:items-center justify-center" onClick={() => setShowContrib(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-white rounded-xl w-full lg:max-w-md shadow-2xl border border-[#EAEAEA]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA]"><h3 className="text-sm font-medium">Aportar a {selected.emoji} {selected.name}</h3><button onClick={() => setShowContrib(false)} className="p-1.5 hover:bg-[#F5F5F5] rounded-md"><X size={14} className="text-[#707070]" /></button></div>
              <div className="p-4 space-y-4">
                <div className="bg-[#FAFAFA] rounded-lg p-3 text-center"><p className="text-[10px] text-[#A0A0A0]">Actual</p><p className="text-lg font-semibold text-[#1A1A1A] mt-0.5">{formatCurrency(selected.current)}</p></div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Monto ($)</label><input type="number" value={cForm.amount} onChange={e => setCForm({...cForm,amount:e.target.value})} placeholder="0" className="input" /></div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Fecha</label><input type="date" value={cForm.date} onChange={e => setCForm({...cForm,date:e.target.value})} className="input" /></div>
                <button onClick={contribute} className="w-full btn-primary text-xs">Aportar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
