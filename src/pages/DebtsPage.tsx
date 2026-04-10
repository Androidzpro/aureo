import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function DebtsPage() {
  const { user } = useAuthStore()
  const [debts, setDebts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', total_amount: '', creditor: '', interest_rate: '0' })

  useEffect(() => { loadDebts() }, [user?.id])

  const loadDebts = async () => {
    if (!user?.id) return
    const { data } = await supabase.from('debts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setDebts(data)
    setLoading(false)
  }

  const addDebt = async () => {
    if (!user?.id || !form.name || !form.total_amount) return
    await supabase.from('debts').insert([{
      user_id: user.id, name: form.name,
      total_amount: parseFloat(form.total_amount),
      creditor: form.creditor || null,
      interest_rate: parseFloat(form.interest_rate) || 0,
      status: 'active'
    }])
    setShowModal(false)
    setForm({ name: '', total_amount: '', creditor: '', interest_rate: '0' })
    loadDebts()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Deudas</h1>
          <p className="text-gray-500 text-sm mt-1">Controla y reduce tus deudas</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600">
          <Plus size={16} className="mr-1.5" /> Nueva deuda
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nueva deuda</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Tarjeta de crédito" /></div>
              <div><Label>Monto total ($)</Label><Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} placeholder="0.00" /></div>
              <div><Label>Acreedor</Label><Input value={form.creditor} onChange={(e) => setForm({ ...form, creditor: e.target.value })} placeholder="Ej: Banco X" /></div>
              <div><Label>Tasa de interés (%)</Label><Input type="number" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} placeholder="0" /></div>
              <Button onClick={addDebt} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">Guardar</Button>
            </div>
          </motion.div>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div>
        : debts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 mb-2">¡Excelente! No tienes deudas 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm mb-1">Deuda total</p>
                  <p className="text-3xl font-bold">{formatCurrency(debts.reduce((s, d) => s + d.total_amount, 0) - debts.reduce((s, d) => s + d.paid_amount, 0))}</p>
                </div>
                <CreditCard size={40} className="text-red-200" />
              </div>
            </div>
            {debts.filter(d => d.status === 'active').map((debt) => {
              const remaining = debt.total_amount - debt.paid_amount
              const pct = (debt.paid_amount / debt.total_amount) * 100
              return (
                <div key={debt.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">{debt.name}</span>
                    <span className="text-sm text-gray-500">{debt.creditor || ''}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                    <div className="h-2.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{pct.toFixed(1)}% pagado</span>
                    <span>Restante: {formatCurrency(remaining)}</span>
                  </div>
                  {debt.interest_rate > 0 && <p className="text-xs text-amber-600 mt-1">Tasa: {debt.interest_rate}%</p>}
                </div>
              )
            })}
          </div>
        )}
    </motion.div>
  )
}
