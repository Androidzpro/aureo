import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CreditCard, DollarSign, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, playSound, cn } from '@/lib/data'

interface Debt { id: string; name: string; total: number; paid: number; interest: number; creditor: string; status: string; payments: { amount: number; date: string }[] }

export default function DebtsPage() {
  const { profile } = useAuthStore()
  const [debts, setDebts] = useState<Debt[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [selected, setSelected] = useState<Debt | null>(null)
  const [form, setForm] = useState({ name: '', total: '', creditor: '', interest: '0' })
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { if (profile?.id) { const s = localStorage.getItem(`ff-debts-${profile.id}`); if (s) setDebts(JSON.parse(s)) } }, [profile?.id])

  const save = (d: Debt[]) => { setDebts(d); if (profile?.id) localStorage.setItem(`ff-debts-${profile.id}`, JSON.stringify(d)) }

  const addDebt = () => {
    if (!form.name || !form.total) return
    save([...debts, { id: Date.now().toString(), name: form.name, total: parseFloat(form.total), paid: 0, interest: parseFloat(form.interest) || 0, creditor: form.creditor, status: 'active', payments: [] }])
    playSound('success'); setShowModal(false); setForm({ name: '', total: '', creditor: '', interest: '0' })
  }

  const addPayment = () => {
    if (!selected || !payForm.amount) return
    const amount = parseFloat(payForm.amount)
    save(debts.map(d => d.id === selected.id ? { ...d, paid: d.paid + amount, status: d.paid + amount >= d.total ? 'paid' : 'active', payments: [...d.payments, { amount, date: payForm.date }] } : d))
    playSound('success'); setShowPay(false); setPayForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setSelected(null)
  }

  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total - d.paid), 0)
  const totalPaid = debts.reduce((s, d) => s + d.paid, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-extrabold text-gray-900">Deudas 💳</h1><p className="text-gray-400 text-sm">Controla y elimina tus deudas</p></div>
        <button onClick={() => { setShowModal(true); playSound('click') }} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold h-10 px-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-1"><Plus size={16} /> Nueva</button>
      </div>

      {debts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white shadow-lg"><p className="text-red-100 text-xs">Pendiente</p><p className="text-xl font-black">{formatCurrency(totalDebt)}</p></div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg"><p className="text-emerald-100 text-xs">Pagado</p><p className="text-xl font-black">{formatCurrency(totalPaid)}</p></div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold">Nueva deuda</h3><button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Nombre</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Tarjeta BBVA" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Monto total ($)</label><input type="number" value={form.total} onChange={e => setForm({...form,total:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Acreedor</label><input value={form.creditor} onChange={e => setForm({...form,creditor:e.target.value})} placeholder="Ej: Banco X" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Interés (%)</label><input type="number" value={form.interest} onChange={e => setForm({...form,interest:e.target.value})} placeholder="0" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <button onClick={addDebt} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold h-12 rounded-xl">Guardar</button>
            </div>
          </motion.div>
        </div>
      )}

      {showPay && selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowPay(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold">Pagar: {selected.name}</h3><button onClick={() => setShowPay(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-xs text-gray-400">Restante</p><p className="text-2xl font-bold text-red-600">{formatCurrency(selected.total - selected.paid)}</p></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Monto ($)</label><input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm,amount:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha</label><input type="date" value={payForm.date} onChange={e => setPayForm({...payForm,date:e.target.value})} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <button onClick={addPayment} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold h-12 rounded-xl">Registrar pago</button>
            </div>
          </motion.div>
        </div>
      )}

      {debts.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-gray-100"><p className="text-4xl mb-2">🎉</p><p className="text-gray-400">¡Sin deudas!</p></div>
        : <div className="space-y-4">
          {debts.map(debt => {
            const remaining = debt.total - debt.paid; const pct = debt.total > 0 ? (debt.paid / debt.total) * 100 : 0
            return (
              <div key={debt.id} className={cn('bg-white rounded-xl border p-5 shadow-sm', debt.status === 'paid' ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', debt.status === 'paid' ? 'bg-emerald-100' : 'bg-red-100')}>
                      <CreditCard size={18} className={debt.status === 'paid' ? 'text-emerald-600' : 'text-red-600'} />
                    </div>
                    <div><h3 className="font-bold text-gray-900">{debt.name}</h3><p className="text-xs text-gray-400">{debt.creditor} {debt.interest > 0 && `• ${debt.interest}%`}</p></div>
                  </div>
                  <div className="flex gap-1">
                    {debt.status === 'active' && <button onClick={() => { setSelected(debt); setShowPay(true); playSound('click') }} className="p-2 hover:bg-emerald-50 rounded-lg"><DollarSign size={16} className="text-emerald-600" /></button>}
                    <button onClick={() => { save(debts.filter(d => d.id !== debt.id)); playSound('delete') }} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2"><div className={cn('h-3 rounded-full', pct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600')} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">{pct.toFixed(1)}% pagado</span><span className="text-gray-400">Restante: {formatCurrency(remaining)}</span></div>
                {debt.payments.length > 0 && <p className="text-xs text-gray-400 mt-2">{debt.payments.length} pago(s) registrado(s)</p>}
              </div>
            )
          })}
        </div>}
    </motion.div>
  )
}
