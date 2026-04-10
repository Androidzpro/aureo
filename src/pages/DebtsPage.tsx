import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CreditCard, DollarSign, Trash2, Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function DebtsPage() {
  const { user } = useAuthStore()
  const [debts, setDebts] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<any>(null)
  const [form, setForm] = useState({ name: '', total_amount: '', creditor: '', interest_rate: '0', min_payment: '', notes: '' })
  const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { loadAll() }, [user?.id])

  const loadAll = async () => {
    if (!user?.id) return
    const [dbtsRes, payRes] = await Promise.all([
      supabase.from('debts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('debt_payments').select('*, debts(name)').eq('user_id', user.id).order('date', { ascending: false }),
    ])
    if (dbtsRes.data) setDebts(dbtsRes.data)
    if (payRes.data) setPayments(payRes.data)
    setLoading(false)
  }

  const addDebt = async () => {
    if (!user?.id || !form.name || !form.total_amount) return
    await supabase.from('debts').insert([{
      user_id: user.id, name: form.name, total_amount: parseFloat(form.total_amount),
      creditor: form.creditor || null, interest_rate: parseFloat(form.interest_rate) || 0,
      min_payment: parseFloat(form.min_payment) || null, notes: form.notes || null, status: 'active'
    }])
    setShowModal(false)
    setForm({ name: '', total_amount: '', creditor: '', interest_rate: '0', min_payment: '', notes: '' })
    loadAll()
  }

  const addPayment = async () => {
    if (!selectedDebt || !paymentForm.amount) return
    const amount = parseFloat(paymentForm.amount)
    await supabase.from('debt_payments').insert([{
      debt_id: selectedDebt.id, amount,
      date: new Date(paymentForm.date).toISOString(), notes: paymentForm.notes || null,
    }])
    const newPaid = selectedDebt.paid_amount + amount
    const status = newPaid >= selectedDebt.total_amount ? 'paid' : 'active'
    await supabase.from('debts').update({ paid_amount: newPaid, status, updated_at: new Date().toISOString() }).eq('id', selectedDebt.id)
    setShowPaymentModal(false)
    setPaymentForm({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] })
    setSelectedDebt(null)
    loadAll()
  }

  const deleteDebt = async (id: string) => {
    await supabase.from('debts').delete().eq('id', id)
    loadAll()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Deudas</h1>
          <p className="text-gray-500 text-sm mt-1">Controla y elimina tus deudas</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600">
          <Plus size={16} className="mr-1.5" /> Nueva deuda
        </Button>
      </div>

      {/* Summary */}
      {!loading && debts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-red-100 text-sm mb-1">Deuda total pendiente</p>
            <p className="text-3xl font-bold">{formatCurrency(debts.filter(d=>d.status==='active').reduce((s,d) => s + (d.total_amount - d.paid_amount), 0))}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-gray-400 text-sm mb-1">Total pagado</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(debts.reduce((s,d) => s + d.paid_amount, 0))}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-gray-400 text-sm mb-1">Pagos realizados</p>
            <p className="text-2xl font-bold text-indigo-600">{payments.length}</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nueva deuda</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder="Ej: Tarjeta BBVA" /></div>
              <div><Label>Monto total ($)</Label><Input type="number" value={form.total_amount} onChange={(e) => setForm({...form,total_amount:e.target.value})} placeholder="0.00" /></div>
              <div><Label>Acreedor</Label><Input value={form.creditor} onChange={(e) => setForm({...form,creditor:e.target.value})} placeholder="Ej: Banco X" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tasa interés (%)</Label><Input type="number" value={form.interest_rate} onChange={(e) => setForm({...form,interest_rate:e.target.value})} placeholder="0" /></div>
                <div><Label>Pago mínimo ($)</Label><Input type="number" value={form.min_payment} onChange={(e) => setForm({...form,min_payment:e.target.value})} placeholder="0" /></div>
              </div>
              <div><Label>Notas</Label><Input value={form.notes} onChange={(e) => setForm({...form,notes:e.target.value})} placeholder="Detalles..." /></div>
              <Button onClick={addDebt} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">Guardar</Button>
            </div>
          </motion.div>
        </div>
      )}

      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Pagar: {selectedDebt.name}</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400">Restante</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedDebt.total_amount - selectedDebt.paid_amount)}</p>
              </div>
              <div><Label>Monto a pagar ($)</Label><Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm,amount:e.target.value})} placeholder="0.00" /></div>
              <div><Label>Fecha</Label><Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm,date:e.target.value})} /></div>
              <div><Label>Notas</Label><Input value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm,notes:e.target.value})} placeholder="Referencia..." /></div>
              <Button onClick={addPayment} className="w-full bg-gradient-to-r from-emerald-500 to-green-600">Registrar pago</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Debts list */}
      {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div>
        : debts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-gray-400">¡No tienes deudas! Excelente trabajo</p>
          </div>
        ) : (
          <div className="space-y-4">
            {debts.map((debt) => {
              const remaining = debt.total_amount - debt.paid_amount
              const pct = debt.total_amount > 0 ? (debt.paid_amount / debt.total_amount) * 100 : 0
              return (
                <div key={debt.id} className={cn('bg-white rounded-2xl border p-5 shadow-sm', debt.status === 'paid' ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100')}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', debt.status === 'paid' ? 'bg-emerald-100' : 'bg-red-100')}>
                        <CreditCard size={18} className={debt.status === 'paid' ? 'text-emerald-600' : 'text-red-600'} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{debt.name}</h3>
                        <p className="text-xs text-gray-400">{debt.creditor || ''} {debt.interest_rate > 0 && `• ${debt.interest_rate}% interés`}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {debt.status === 'active' && (
                        <button onClick={() => { setSelectedDebt(debt); setShowPaymentModal(true) }} className="p-2 hover:bg-emerald-50 rounded-lg transition-colors">
                          <DollarSign size={16} className="text-emerald-600" />
                        </button>
                      )}
                      <button onClick={() => deleteDebt(debt.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                    <div className={cn('h-3 rounded-full transition-all', debt.status === 'paid' ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600')} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{pct.toFixed(1)}% pagado</span>
                    <span>Restante: {formatCurrency(remaining)}</span>
                  </div>
                  {debt.status === 'paid' && <p className="text-xs text-emerald-600 font-medium mt-2 text-center">✅ ¡Deuda pagada!</p>}
                </div>
              )
            })}

            {/* Payment history */}
            {payments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Receipt size={18} /> Historial de pagos</h3>
                <div className="space-y-2">
                  {payments.slice(0, 10).map(pay => (
                    <div key={pay.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pay.debts?.name || 'Deuda eliminada'}</p>
                        <p className="text-xs text-gray-400">{formatDate(pay.date)} {pay.notes && `• ${pay.notes}`}</p>
                      </div>
                      <span className="font-semibold text-emerald-600">-{formatCurrency(pay.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
    </motion.div>
  )
}
