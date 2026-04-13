import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase, getCat, formatCurrency, cn } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'

export default function DebtsPage() {
  const { profile } = useAuthStore()
  const [debts, setDebts] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState({ name: '', total: '', creditor: '', interest: '0' })
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { if (profile?.id) { const s = localStorage.getItem(`ff-debts-${profile.id}`); if (s) setDebts(JSON.parse(s)) } }, [profile?.id])

  const save = (d: any[]) => { setDebts(d); if (profile?.id) localStorage.setItem(`ff-debts-${profile.id}`, JSON.stringify(d)) }
  const addDebt = () => { if (!form.name || !form.total) return; save([...debts, { id: Date.now().toString(), name: form.name, total: parseFloat(form.total), paid: 0, interest: parseFloat(form.interest) || 0, creditor: form.creditor, status: 'active', payments: [] }]); setShowModal(false); setForm({ name: '', total: '', creditor: '', interest: '0' }) }
  const addPayment = () => { if (!selected || !payForm.amount) return; const a = parseFloat(payForm.amount); save(debts.map(d => d.id === selected.id ? { ...d, paid: d.paid + a, status: d.paid + a >= d.total ? 'paid' : 'active', payments: [...d.payments, { amount: a, date: payForm.date }] } : d)); setShowPay(false); setPayForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setSelected(null) }

  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total - d.paid), 0)
  const totalPaid = debts.reduce((s, d) => s + d.paid, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Deudas</h1><p className="page-subtitle">Controla y elimina tus deudas</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5"><Plus size={15} /> Nueva deuda</button>
      </div>

      {debts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="kpi"><p className="kpi-label text-red-600">Pendiente</p><p className="kpi-value text-red-600">{formatCurrency(totalDebt)}</p></div>
          <div className="kpi"><p className="kpi-label text-emerald-600">Pagado</p><p className="kpi-value text-emerald-600">{formatCurrency(totalPaid)}</p></div>
        </div>
      )}

      {debts.length === 0 ? <div className="card empty-state"><p className="text-3xl mb-2">🎉</p><p className="text-sm text-[#707070]">¡Sin deudas! Excelente trabajo</p></div>
        : <div className="space-y-3">
          {debts.map(debt => {
            const remaining = debt.total - debt.paid; const pct = debt.total > 0 ? (debt.paid / debt.total) * 100 : 0
            return (
              <div key={debt.id} className={cn('card p-5', debt.status === 'paid' ? 'border-emerald-200 bg-emerald-50/30' : '')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', debt.status === 'paid' ? 'bg-emerald-100' : 'bg-red-50')}>
                      <span className="text-sm">{debt.status === 'paid' ? '✅' : '💳'}</span>
                    </div>
                    <div><h3 className="text-sm font-medium text-[#1A1A1A]">{debt.name}</h3><p className="text-xs text-[#A0A0A0]">{debt.creditor}{debt.interest > 0 && ` · ${debt.interest}%`}</p></div>
                  </div>
                  <div className="flex gap-1">
                    {debt.status === 'active' && <button onClick={() => { setSelected(debt); setShowPay(true) }} className="btn-secondary px-2.5 py-1.5 text-xs">Pagar</button>}
                    <button onClick={() => { save(debts.filter(d => d.id !== debt.id)) }} className="p-1.5 hover:bg-red-50 rounded-md"><X size={14} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="w-full bg-[#F0F0F0] rounded-full h-1.5 mb-2"><div className={cn('h-1.5 rounded-full', debt.status === 'paid' ? 'bg-emerald-500' : 'bg-[#1A1A1A]')} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                <div className="flex justify-between text-xs"><span className="text-[#707070]">{pct.toFixed(0)}% pagado</span><span className="text-[#A0A0A0]">Restante: {formatCurrency(remaining)}</span></div>
              </div>
            )
          })}
        </div>}

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-white rounded-lg w-full lg:max-w-md shadow-xl border border-[#EAEAEA]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#EAEAEA]"><h3 className="text-sm font-medium">Nueva deuda</h3><button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#F5F5F5] rounded"><X size={14} className="text-[#707070]" /></button></div>
              <div className="p-5 space-y-4">
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Nombre</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Tarjeta BBVA" className="input" /></div>
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Monto total ($)</label><input type="number" value={form.total} onChange={e => setForm({...form,total:e.target.value})} placeholder="0.00" className="input" /></div>
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Acreedor</label><input value={form.creditor} onChange={e => setForm({...form,creditor:e.target.value})} placeholder="Ej: Banco X" className="input" /></div>
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Interés (%)</label><input type="number" value={form.interest} onChange={e => setForm({...form,interest:e.target.value})} placeholder="0" className="input" /></div>
                <div className="flex gap-2 pt-2"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={addDebt} className="btn-primary flex-1">Guardar</button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showPay && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-end lg:items-center justify-center" onClick={() => setShowPay(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-white rounded-lg w-full lg:max-w-md shadow-xl border border-[#EAEAEA]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#EAEAEA]"><h3 className="text-sm font-medium">Pagar: {selected.name}</h3><button onClick={() => setShowPay(false)} className="p-1 hover:bg-[#F5F5F5] rounded"><X size={14} className="text-[#707070]" /></button></div>
              <div className="p-5 space-y-4">
                <div className="bg-[#FAFAFA] rounded-lg p-4 text-center"><p className="text-xs text-[#A0A0A0]">Restante</p><p className="text-xl font-semibold text-red-600 mt-1">{formatCurrency(selected.total - selected.paid)}</p></div>
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Monto ($)</label><input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm,amount:e.target.value})} placeholder="0.00" className="input" /></div>
                <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Fecha</label><input type="date" value={payForm.date} onChange={e => setPayForm({...payForm,date:e.target.value})} className="input" /></div>
                <button onClick={addPayment} className="w-full btn-primary">Registrar pago</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
