import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CreditCard, DollarSign, Trash2, Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, playSound, cn } from '@/lib/data'
import { Button } from '@/components/ui/button'

interface Debt {
  id: string
  name: string
  total: number
  paid: number
  interest: number
  minPayment: number
  creditor: string
  status: 'active' | 'paid'
  payments: { amount: number; date: string; notes: string }[]
}

export default function DebtsPage() {
  const { user } = useAuthStore()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [form, setForm] = useState({ name: '', total: '', creditor: '', interest: '0', minPayment: '' })
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' })

  // Load debts from transactions tagged as debt payments
  const loadDebts = async () => {
    if (!user?.id) return
    setLoading(true)
    // Get debts from localStorage
    const stored = localStorage.getItem(`ff-debts-${user.id}`)
    if (stored) setDebts(JSON.parse(stored))
    setLoading(false)
  }

  useState(() => { loadDebts() })

  const saveDebts = (newDebts: Debt[]) => {
    setDebts(newDebts)
    if (user?.id) localStorage.setItem(`ff-debts-${user.id}`, JSON.stringify(newDebts))
  }

  const addDebt = () => {
    if (!form.name || !form.total) return
    const newDebt: Debt = {
      id: Date.now().toString(),
      name: form.name,
      total: parseFloat(form.total),
      paid: 0,
      interest: parseFloat(form.interest) || 0,
      minPayment: parseFloat(form.minPayment) || 0,
      creditor: form.creditor,
      status: 'active',
      payments: [],
    }
    saveDebts([...debts, newDebt])
    playSound('success')
    setShowModal(false)
    setForm({ name: '', total: '', creditor: '', interest: '0', minPayment: '' })
  }

  const addPayment = () => {
    if (!selectedDebt || !payForm.amount) return
    const amount = parseFloat(payForm.amount)
    const updated = debts.map(d => {
      if (d.id === selectedDebt.id) {
        const newPaid = d.paid + amount
        return { ...d, paid: newPaid, status: newPaid >= d.total ? 'paid' as const : 'active' as const, payments: [...d.payments, { amount, date: payForm.date, notes: payForm.notes }] }
      }
      return d
    })
    saveDebts(updated)
    playSound('success')
    setShowPaymentModal(false)
    setPayForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' })
    setSelectedDebt(null)
  }

  const deleteDebt = (id: string) => {
    saveDebts(debts.filter(d => d.id !== id))
    playSound('delete')
  }

  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total - d.paid), 0)
  const totalPaid = debts.reduce((s, d) => s + d.paid, 0)
  const activeDebts = debts.filter(d => d.status === 'active')
  const paidDebts = debts.filter(d => d.status === 'paid')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-extrabold text-gray-900">Deudas 💳</h1>
          <p className="text-gray-400 text-sm">Controla y elimina tus deudas</p></div>
        <Button onClick={() => { setShowModal(true); playSound('click') }} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
          <Plus size={16} className="mr-1" /> Nueva deuda
        </Button>
      </div>

      {/* Summary */}
      {debts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-red-100 text-xs mb-1">Deuda pendiente</p>
            <p className="text-2xl font-black">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-emerald-100 text-xs mb-1">Total pagado</p>
            <p className="text-2xl font-black">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      )}

      {/* Strategy tip */}
      {activeDebts.length > 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <p className="font-bold text-blue-800 text-sm">Estrategia recomendada: Avalancha</p>
            <p className="text-xs text-blue-600 mt-0.5">Paga primero la deuda con mayor tasa de interés. Ahorrarás más dinero a largo plazo.</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
            className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold">Nueva deuda</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Tarjeta BBVA" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Monto total ($)</label>
                <input type="number" value={form.total} onChange={e => setForm({...form,total:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Acreedor</label>
                <input value={form.creditor} onChange={e => setForm({...form,creditor:e.target.value})} placeholder="Ej: Banco X" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500 uppercase">Interés (%)</label>
                  <input type="number" value={form.interest} onChange={e => setForm({...form,interest:e.target.value})} placeholder="0" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Pago mín ($)</label>
                  <input type="number" value={form.minPayment} onChange={e => setForm({...form,minPayment:e.target.value})} placeholder="0" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              </div>
              <Button onClick={addDebt} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold h-12 rounded-xl">Guardar deuda</Button>
            </div>
          </motion.div>
        </div>
      )}

      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowPaymentModal(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
            className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold">Pagar: {selectedDebt.name}</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400">Restante por pagar</p>
                <p className="text-3xl font-black text-red-600 mt-1">{formatCurrency(selectedDebt.total - selectedDebt.paid)}</p>
                {selectedDebt.minPayment > 0 && <p className="text-xs text-gray-400 mt-1">Pago mínimo: {formatCurrency(selectedDebt.minPayment)}</p>}
              </div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Monto a pagar ($)</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm,amount:e.target.value})} placeholder="0.00" className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha</label>
                <input type="date" value={payForm.date} onChange={e => setPayForm({...payForm,date:e.target.value})} className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Notas</label>
                <input value={payForm.notes} onChange={e => setPayForm({...payForm,notes:e.target.value})} placeholder="Referencia..." className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm mt-1" /></div>
              <Button onClick={addPayment} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold h-12 rounded-xl">Registrar pago</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Debts list */}
      {loading ? <div className="text-center py-12 text-gray-300">Cargando...</div>
        : debts.length === 0 ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl mb-4">🎉</motion.div>
            <p className="text-gray-400 font-medium">¡No tienes deudas!</p>
            <p className="text-gray-300 text-sm mt-1">Excelente trabajo financiero</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {activeDebts.map(debt => {
              const remaining = debt.total - debt.paid
              const pct = debt.total > 0 ? (debt.paid / debt.total) * 100 : 0
              return (
                <motion.div key={debt.id} layout className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', debt.status === 'paid' ? 'bg-emerald-100' : 'bg-red-100')}>
                        {debt.status === 'paid' ? <CheckCircle2 size={20} className="text-emerald-600" /> : <CreditCard size={20} className="text-red-600" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{debt.name}</h3>
                        <p className="text-xs text-gray-400">{debt.creditor} {debt.interest > 0 && `• ${debt.interest}% interés`}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedDebt(debt); setShowPaymentModal(true); playSound('click') }}
                        className="p-2 hover:bg-emerald-50 rounded-xl transition-colors">
                        <DollarSign size={16} className="text-emerald-600" />
                      </button>
                      <button onClick={() => deleteDebt(debt.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                      className={cn('h-3 rounded-full transition-all', pct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600')} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={cn('font-medium', pct >= 100 ? 'text-emerald-600' : 'text-gray-500')}>{pct.toFixed(1)}% pagado</span>
                    <span className="text-gray-400">Restante: {formatCurrency(remaining)}</span>
                  </div>
                  {debt.minPayment > 0 && <p className="text-xs text-amber-600 mt-1">⚠️ Pago mínimo: {formatCurrency(debt.minPayment)}</p>}

                  {/* Payment history */}
                  {debt.payments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Receipt size={12} /> Historial de pagos</p>
                      <div className="space-y-1.5">
                        {debt.payments.slice(-3).map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{formatDate(p.date)} {p.notes && `• ${p.notes}`}</span>
                            <span className="font-bold text-emerald-600">-{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}

            {/* Paid debts */}
            {paidDebts.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle2 size={12} /> Deudas pagadas</p>
                {paidDebts.map(debt => (
                  <div key={debt.id} className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4 mb-3 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-emerald-600" />
                        <span className="font-bold text-emerald-800">{debt.name}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">✅ Pagada</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </motion.div>
  )
}
