import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CreditCard, DollarSign, Trash2, CheckCircle2, Pencil } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, playSound, cn } from '@/lib/data'
import { ConfirmDialog, EmptyState } from '@/components/UI'
import type { Debt } from '@/types'

export default function DebtsPage() {
  const { profile } = useAuthStore()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [selected, setSelected] = useState<Debt | null>(null)
  const [form, setForm] = useState({ name: '', total: '', creditor: '', interest: '0', minPayment: '' })
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { load() }, [profile?.id])

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase.from('debts').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
    if (data) setDebts(data)
    setLoading(false)
  }

  const openAdd = () => { setForm({ name: '', total: '', creditor: '', interest: '0', minPayment: '' }); setEditing(null); setShowModal(true) }
  const openEdit = (d: Debt) => { setForm({ name: d.name, total: String(d.total_amount), creditor: d.creditor || '', interest: String(d.interest_rate), minPayment: d.min_payment ? String(d.min_payment) : '' }); setEditing(d); setShowModal(true) }

  const saveDebt = async () => {
    if (!profile?.id || !form.name || !form.total) return
    const data = { user_id: profile.id, name: form.name, total_amount: parseFloat(form.total), creditor: form.creditor || null, interest_rate: parseFloat(form.interest) || 0, min_payment: form.minPayment ? parseFloat(form.minPayment) : null }
    if (editing) {
      await supabase.from('debts').update(data).eq('id', editing.id)
    } else {
      await supabase.from('debts').insert([{ ...data, paid_amount: 0, status: 'active' }])
    }
    setShowModal(false); setEditing(null); load()
  }

  const addPayment = async () => {
    if (!selected || !payForm.amount) return
    const amount = parseFloat(payForm.amount)
    if (amount <= 0) return
    const newPaid = selected.paid_amount + amount
    const status = newPaid >= selected.total_amount ? 'paid' : 'active'
    // Insert payment record
    await supabase.from('debt_payments').insert([{ debt_id: selected.id, user_id: profile!.id, amount, date: new Date(payForm.date).toISOString(), notes: payForm.notes || null }])
    // Update debt
    await supabase.from('debts').update({ paid_amount: newPaid, status }).eq('id', selected.id)
    setShowPay(false); setPayForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' }); setSelected(null); load()
  }

  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total_amount - d.paid_amount), 0)
  const totalPaid = debts.reduce((s, d) => s + d.paid_amount, 0)
  const totalInterest = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total_amount - d.paid_amount) * (d.interest_rate / 100), 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Deudas</h1><p className="text-xs text-gray-400">Controla y elimina tus deudas</p></div>
        <button onClick={openAdd} className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/30 active:scale-90 transition-transform"><Plus size={18} className="text-white" /></button>
      </div>

      {/* Summary */}
      {debts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] font-medium text-red-500 uppercase">Pendiente</p><p className="text-base font-bold text-red-600">{formatCurrency(totalDebt, profile?.currency)}</p></div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] font-medium text-emerald-600 uppercase">Pagado</p><p className="text-base font-bold text-emerald-600">{formatCurrency(totalPaid, profile?.currency)}</p></div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] font-medium text-amber-500 uppercase">Interés est.</p><p className="text-base font-bold text-amber-600">{formatCurrency(totalInterest, profile?.currency)}</p></div>
        </div>
      )}

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
        : debts.length === 0 ? <EmptyState emoji="🎉" title="¡Sin deudas!" message="Excelente trabajo financiero" />
          : debts.map(debt => {
            const remaining = debt.total_amount - debt.paid_amount; const pct = debt.total_amount > 0 ? (debt.paid_amount / debt.total_amount) * 100 : 0
            return (
              <div key={debt.id} className={cn('bg-white dark:bg-gray-900 rounded-xl border p-4', debt.status === 'paid' ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-100 dark:border-gray-800')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', debt.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20')}>
                      {debt.status === 'paid' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <CreditCard size={14} className="text-red-600" />}
                    </div>
                    <div><h3 className="text-xs font-medium text-gray-900 dark:text-white">{debt.name}</h3><p className="text-[10px] text-gray-400">{debt.creditor}{debt.interest_rate > 0 && ` · ${debt.interest_rate}% interés`}{debt.due_date && ` · Vence: ${new Date(debt.due_date).toLocaleDateString('es-MX')}`}</p></div>
                  </div>
                  <div className="flex gap-1">
                    {debt.status === 'active' && <button onClick={() => openEdit(debt)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Pencil size={12} className="text-gray-400" /></button>}
                    {debt.status === 'active' && <button onClick={() => { setSelected(debt); setShowPay(true) }} className="btn-secondary px-2 py-1.5 text-[10px]">Pagar</button>}
                    <button onClick={() => setConfirmDelete(debt.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2"><div className={cn('h-1.5 rounded-full', debt.status === 'paid' ? 'bg-emerald-500' : 'bg-indigo-500')} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                <div className="flex justify-between text-[10px]"><span className="text-gray-400">{pct.toFixed(0)}% pagado</span><span className="text-gray-400">Restante: {formatCurrency(remaining, profile?.currency)}</span></div>
                {debt.min_payment && <p className="text-[10px] text-amber-600 mt-1">⚠️ Pago mínimo: {formatCurrency(debt.min_payment, profile?.currency)}</p>}
              </div>
            )
          })}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => { setShowModal(false); setEditing(null) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">{editing ? 'Editar deuda' : 'Nueva deuda'}</h3><button onClick={() => { setShowModal(false); setEditing(null) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 space-y-4">
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Nombre</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Tarjeta BBVA" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Monto total ($)</label><input type="number" value={form.total} onChange={e => setForm({...form,total:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Acreedor</label><input value={form.creditor} onChange={e => setForm({...form,creditor:e.target.value})} placeholder="Ej: Banco X" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Interés (%)</label><input type="number" value={form.interest} onChange={e => setForm({...form,interest:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                  <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Pago mín ($)</label><input type="number" value={form.minPayment} onChange={e => setForm({...form,minPayment:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                </div>
                <button onClick={saveDebt} className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-xs">{editing ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pay Modal */}
      <AnimatePresence>
        {showPay && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowPay(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">Pagar: {selected.name}</h3><button onClick={() => setShowPay(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center"><p className="text-[10px] text-gray-400">Restante</p><p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(selected.total_amount - selected.paid_amount, profile?.currency)}</p></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Monto ($)</label><input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm,amount:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Fecha</label><input type="date" value={payForm.date} onChange={e => setPayForm({...payForm,date:e.target.value})} className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white" /></div>
                <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Notas</label><input value={payForm.notes} onChange={e => setPayForm({...payForm,notes:e.target.value})} placeholder="Referencia..." className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                <button onClick={addPayment} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl text-xs">Registrar pago</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!confirmDelete} title="Eliminar deuda" message="Se perderá todo el historial de pagos" danger confirmLabel="Eliminar" onConfirm={async () => { if (confirmDelete) { await supabase.from('debts').delete().eq('id', confirmDelete); setConfirmDelete(null); load() }}} onCancel={() => setConfirmDelete(null)} />
    </motion.div>
  )
}
