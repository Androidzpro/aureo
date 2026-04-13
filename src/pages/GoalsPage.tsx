import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, DollarSign, Trash2, Trophy, Pencil } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, playSound, cn } from '@/lib/data'
import { ConfirmDialog, EmptyState } from '@/components/UI'
import type { SavingsGoal } from '@/types'

const COLORS = ['#6366F1','#10B981','#F59E0B','#EC4899','#8B5CF6','#3B82F6']

export default function GoalsPage() {
  const { profile } = useAuthStore()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showContrib, setShowContrib] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [selected, setSelected] = useState<SavingsGoal | null>(null)
  const [form, setForm] = useState({ name: '', target: '', current: '0', emoji: '🎯' })
  const [cForm, setCForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { load() }, [profile?.id])

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase.from('savings_goals').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
    if (data) setGoals(data)
    setLoading(false)
  }

  const openAdd = () => { setForm({ name: '', target: '', current: '0', emoji: '🎯' }); setEditing(null); setShowModal(true) }
  const openEdit = (g: Goal) => { setForm({ name: g.name, target: String(g.target_amount), current: String(g.current_amount), emoji: g.emoji }); setEditing(g); setShowModal(true) }

  const saveGoal = async () => {
    if (!profile?.id || !form.name || !form.target) return
    const data = { user_id: profile.id, name: form.name, target_amount: parseFloat(form.target), current_amount: parseFloat(form.current) || 0, emoji: form.emoji, color: COLORS[Math.floor(Math.random() * COLORS.length)] }
    if (editing) {
      await supabase.from('savings_goals').update(data).eq('id', editing.id)
    } else {
      await supabase.from('savings_goals').insert([data])
    }
    setShowModal(false); setEditing(null); load()
  }

  const contribute = async () => {
    if (!selected || !cForm.amount) return
    const amount = parseFloat(cForm.amount)
    if (amount <= 0) return
    const newAmount = selected.current_amount + amount
    await supabase.from('savings_goals').update({ current_amount: newAmount }).eq('id', selected.id)
    await supabase.from('goal_contributions').insert([{ goal_id: selected.id, user_id: profile!.id, amount, date: new Date(cForm.date).toISOString() }])
    setShowContrib(false); setCForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setSelected(null); load()
  }

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Metas de Ahorro</h1><p className="text-xs text-gray-400">Planifica y alcanza tus objetivos</p></div>
        <button onClick={openAdd} className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/30 active:scale-90 transition-transform"><Plus size={18} className="text-white" /></button>
      </div>

      {goals.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
          <p className="text-white/60 text-[10px] uppercase">Total ahorrado</p>
          <p className="text-xl font-bold">{formatCurrency(totalSaved, profile?.currency)}<span className="text-sm font-normal text-white/60 ml-1">de {formatCurrency(totalTarget, profile?.currency)}</span></p>
          <div className="w-full bg-white/20 rounded-full h-1.5 mt-2"><div className="h-1.5 rounded-full bg-white/80 transition-all" style={{ width: `${totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0}%` }} /></div>
        </div>
      )}

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
        : goals.length === 0 ? <EmptyState emoji="🎯" title="Sin metas aún" message="Crea tu primera meta de ahorro" actionLabel="Crear meta" action={openAdd} />
          : goals.filter(g => g.is_active !== false).map(g => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0; const done = pct >= 100
            return (
              <div key={g.id} className={cn('bg-white dark:bg-gray-900 rounded-xl border p-4', done ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-100 dark:border-gray-800')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: g.color + '15' }}>{done ? <Trophy size={14} className="text-amber-500" /> : g.emoji}</div>
                    <div><h3 className="text-xs font-medium text-gray-900 dark:text-white">{g.name}</h3>{g.deadline && <p className="text-[10px] text-gray-400">📅 {new Date(g.deadline).toLocaleDateString('es-MX')}</p>}</div>
                  </div>
                  <div className="flex gap-1">
                    {!done && <button onClick={() => openEdit(g)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Pencil size={12} className="text-gray-400" /></button>}
                    {!done && <button onClick={() => { setSelected(g); setShowContrib(true) }} className="btn-secondary px-2 py-1.5 text-[10px]">Aportar</button>}
                    <button onClick={() => setConfirmDelete(g.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2"><div className="h-1.5 rounded-full" style={{ width: `${Math.min(pct,100)}%`, backgroundColor: done ? '#10B981' : g.color }} /></div>
                <div className="flex justify-between items-end">
                  <div><p className="text-xs font-medium text-gray-900 dark:text-white">{formatCurrency(g.current_amount, profile?.currency)}</p><p className="text-[10px] text-gray-400">de {formatCurrency(g.target_amount, profile?.currency)}</p></div>
                  <div className="text-right"><p className={cn('text-sm font-bold', done ? 'text-emerald-600' : 'text-gray-900 dark:text-white')}>{pct.toFixed(0)}%</p>{done ? <p className="text-[10px] text-emerald-600 font-medium">🎉 ¡Meta alcanzada!</p> : <p className="text-[10px] text-gray-400">Falta {formatCurrency(g.target_amount - g.current_amount, profile?.currency)}</p>}</div>
                </div>
              </div>
            )
          })}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => { setShowModal(false); setEditing(null) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">{editing ? 'Editar meta' : 'Nueva meta'}</h3><button onClick={() => { setShowModal(false); setEditing(null) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 space-y-4">
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Nombre</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Vacaciones" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Monto objetivo ($)</label><input type="number" value={form.target} onChange={e => setForm({...form,target:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Ahorrado ($)</label><input type="number" value={form.current} onChange={e => setForm({...form,current:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Fecha límite (opcional)</label><input type="date" value={form.target ? '' : ''} onChange={() => {}} className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-2">Emoji</label>
                  <div className="flex gap-1.5 flex-wrap">{['🏖️','🚗','🏠','📱','💻','🎓','✈️','🎮','👶','💍'].map(e => (
                    <button key={e} onClick={() => setForm({...form,emoji:e})} className={cn('w-9 h-9 rounded-lg text-lg', form.emoji === e ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-800')}>{e}</button>
                  ))}</div>
                </div>
                <button onClick={saveGoal} className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-xs">{editing ? 'Actualizar' : 'Crear'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contribute Modal */}
      <AnimatePresence>
        {showContrib && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowContrib(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">Aportar a {selected.emoji} {selected.name}</h3><button onClick={() => setShowContrib(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center"><p className="text-[10px] text-gray-400">Actual</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(selected.current_amount, profile?.currency)}</p></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Monto ($)</label><input type="number" value={cForm.amount} onChange={e => setCForm({...cForm,amount:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Fecha</label><input type="date" value={cForm.date} onChange={e => setCForm({...cForm,date:e.target.value})} className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white" /></div>
                <button onClick={contribute} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl text-xs">Aportar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!confirmDelete} title="Eliminar meta" message="Se perderá todo el progreso" danger confirmLabel="Eliminar" onConfirm={async () => { if (confirmDelete) { await supabase.from('savings_goals').delete().eq('id', confirmDelete); setConfirmDelete(null); load() }}} onCancel={() => setConfirmDelete(null)} />
    </motion.div>
  )
}
