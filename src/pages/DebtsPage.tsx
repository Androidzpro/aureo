import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CreditCard, DollarSign, Trash2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, playSound, cn } from '@/lib/data'

interface Debt { id: string; name: string; total: number; paid: number; interest: number; creditor: string; status: string; payments: { amount: number; date: string }[] }

export default function DebtsPage() {
  const { user } = useAuthStore()
  const [debts, setDebts] = useState<Debt[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [selected, setSelected] = useState<Debt | null>(null)
  const [form, setForm] = useState({ name: '', total: '', creditor: '', interest: '0' })
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { if (user?.id) { const s = localStorage.getItem(`ff-debts-${user.id}`); if (s) setDebts(JSON.parse(s)) } }, [user?.id])

  const save = (d: Debt[]) => { setDebts(d); if (user?.id) localStorage.setItem(`ff-debts-${user.id}`, JSON.stringify(d)) }
  const addDebt = () => { if (!form.name || !form.total) return; save([...debts, { id: Date.now().toString(), name: form.name, total: parseFloat(form.total), paid: 0, interest: parseFloat(form.interest) || 0, creditor: form.creditor, status: 'active', payments: [] }]); setShowModal(false); setForm({ name: '', total: '', creditor: '', interest: '0' }) }
  const addPayment = () => { if (!selected || !payForm.amount) return; const a = parseFloat(payForm.amount); save(debts.map(d => d.id === selected.id ? { ...d, paid: d.paid + a, status: d.paid + a >= d.total ? 'paid' : 'active', payments: [...d.payments, { amount: a, date: payForm.date }] } : d)); setShowPay(false); setPayForm({ amount: '', date: new Date().toISOString().split('T')[0] }); setSelected(null) }

  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total - d.paid), 0)
  const totalPaid = debts.reduce((s, d) => s + d.paid, 0)

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
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Deudas</h1><p className="text-xs text-gray-400">Controla y elimina tus deudas</p></div>
        <button onClick={() => setShowModal(true)} className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/30 active:scale-90 transition-transform"><Plus size={18} className="text-white" /></button>
      </div>

      {debts.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-4"><p className="text-[10px] font-medium text-red-500 uppercase">Pendiente</p><p className="text-lg font-bold text-red-600">{formatCurrency(totalDebt)}</p></div>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-4"><p className="text-[10px] font-medium text-emerald-600 uppercase">Pagado</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p></div>
        </div>
      )}

      {debts.length === 0 ? <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center py-10 text-center"><p className="text-2xl mb-2">🎉</p><p className="text-xs text-gray-400">¡Sin deudas!</p></div>
        : debts.map(debt => {
          const remaining = debt.total - debt.paid; const pct = debt.total > 0 ? (debt.paid / debt.total) * 100 : 0
          return (
            <div key={debt.id} className={cn('bg-white dark:bg-[#1A1A1A] rounded-xl border p-4', debt.status === 'paid' ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-100 dark:border-gray-800')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', debt.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20')}>
                    {debt.status === 'paid' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <CreditCard size={14} className="text-red-600" />}
                  </div>
                  <div><h3 className="text-xs font-medium text-gray-900 dark:text-white">{debt.name}</h3><p className="text-[10px] text-gray-400">{debt.creditor}{debt.interest > 0 && ` · ${debt.interest}%`}</p></div>
                </div>
                <div className="flex gap-1">
                  {debt.status === 'active' && <button onClick={() => { setSelected(debt); setShowPay(true) }} className="btn-secondary px-2 py-1.5 text-[10px]">Pagar</button>}
                  <button onClick={() => { save(debts.filter(d => d.id !== debt.id)) }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-2"><div className={cn('h-1.5 rounded-full', debt.status === 'paid' ? 'bg-emerald-500' : 'bg-indigo-500')} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              <div className="flex justify-between text-[10px]"><span className="text-gray-400">{pct.toFixed(0)}% pagado</span><span className="text-gray-400">Restante: {formatCurrency(remaining)}</span></div>
            </div>
          )
        })}

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Nueva deuda">
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Nombre</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Tarjeta BBVA" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Monto total ($)</label><input type="number" value={form.total} onChange={e => setForm({...form,total:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Acreedor</label><input value={form.creditor} onChange={e => setForm({...form,creditor:e.target.value})} placeholder="Ej: Banco X" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Interés (%)</label><input type="number" value={form.interest} onChange={e => setForm({...form,interest:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        <div className="flex gap-2"><button onClick={() => setShowModal(false)} className="flex-1 h-11 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs">Cancelar</button><button onClick={addDebt} className="flex-1 h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-xs">Guardar</button></div>
      </Modal>

      <Modal show={showPay && !!selected} onClose={() => setShowPay(false)} title={`Pagar: ${selected?.name}`}>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center"><p className="text-[10px] text-gray-400">Restante</p><p className="text-xl font-bold text-red-600 mt-1">{formatCurrency((selected?.total || 0) - (selected?.paid || 0))}</p></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Monto ($)</label><input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm,amount:e.target.value})} placeholder="0" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Fecha</label><input type="date" value={payForm.date} onChange={e => setPayForm({...payForm,date:e.target.value})} className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white" /></div>
        <button onClick={addPayment} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl text-xs">Registrar pago</button>
      </Modal>
    </motion.div>
  )
}
