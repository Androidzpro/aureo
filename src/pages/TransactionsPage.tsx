import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Filter, ArrowUpRight, ArrowDownRight, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { loadTransactions() }, [user?.id])

  const loadTransactions = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (data) setTransactions(data)
    setLoading(false)
  }

  const addTransaction = async () => {
    if (!user?.id || !form.amount || !form.description) return
    await supabase.from('transactions').insert([{
      user_id: user.id,
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      category_id: form.category_id || null,
      date: new Date(form.date).toISOString(),
    }])
    setShowModal(false)
    setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] })
    loadTransactions()
  }

  const deleteTransaction = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    loadTransactions()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-gray-500 text-sm mt-1">Registro de todos tus ingresos y gastos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
            <Plus size={16} className="mr-1.5" /> Nuevo
          </Button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nuevo movimiento</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className={cn(
                      'flex-1 py-2 rounded-lg font-medium text-sm transition-colors',
                      form.type === t
                        ? t === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {t === 'income' ? 'Ingreso' : 'Gasto'}
                  </button>
                ))}
              </div>
              <div>
                <Label>Descripción</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Salario mensual" />
              </div>
              <div>
                <Label>Monto ($)</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <Button onClick={addTransaction} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">
                Guardar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 mb-2">No hay movimientos aún</p>
          <Button onClick={() => setShowModal(true)} variant="outline">Agrega el primero</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
                  )}>
                    {tx.type === 'income' ? <ArrowUpRight size={18} className="text-emerald-600" /> : <ArrowDownRight size={18} className="text-red-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-400">{tx.categories?.name || 'Sin categoría'} • {formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('font-semibold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                  <button onClick={() => deleteTransaction(tx.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
