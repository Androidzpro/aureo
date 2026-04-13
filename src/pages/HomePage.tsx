import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, ArrowUpRight, ArrowDownRight, X, CreditCard, Target, TrendingUp, ChevronRight, Lightbulb } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, analyzeFinances, playSound, getCat, cn } from '@/lib/data'

export default function HomePage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load() }, [profile?.id])

  const load = async () => {
    if (!profile?.id) return
    // Try new transactions table first, fallback to legacy
    const { data: newTxs } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false }).limit(50)
    if (newTxs) setTxs(newTxs)
    setLoading(false)
  }

  const analysis = useMemo(() => analyzeFinances(txs), [txs])
  const now = new Date()
  const monthTxs = useMemo(() => txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }), [txs, now])
  const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const addTx = async () => {
    if (!profile?.id || !form.amount || !form.description) return
    await supabase.from('transactions').insert([{
      user_id: profile.id, type: form.type, amount: parseFloat(form.amount),
      description: form.description, category_id: form.category_id || '',
      date: new Date(form.date).toISOString(),
    }])
    playSound('success'); setShowModal(false)
    setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const deleteTx = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    playSound('delete'); load()
  }

  const expenseCats = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); map[c.name] = (map[c.name] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [monthTxs])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'} 👋</h1>
        <p className="text-gray-400 text-sm mt-0.5">{now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Health Score */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className={cn('rounded-2xl p-5 text-white relative overflow-hidden',
          analysis.score >= 70 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : analysis.score >= 40 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-600')}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Salud financiera</p>
            <p className="text-4xl font-black">{analysis.score}%</p>
            <p className="text-white/70 text-xs mt-1">{analysis.healthLabel}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-white/80 text-xs">Ahorro: <b>{analysis.savingsRate.toFixed(0)}%</b></p>
            <p className="text-white/80 text-xs">Gasto diario: <b>{formatCurrency(analysis.avgDaily)}</b></p>
          </div>
        </div>
        <div className="mt-4 w-full bg-white/20 rounded-full h-2 relative z-10">
          <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.score}%` }} transition={{ delay: 0.3, duration: 1 }} className="h-2 rounded-full bg-white/80" />
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center"><ArrowUpRight size={14} className="text-emerald-600" /></div></div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Ingresos</p>
          <p className="text-base font-bold text-emerald-600">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center"><ArrowDownRight size={14} className="text-red-600" /></div></div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Gastos</p>
          <p className="text-base font-bold text-red-600">{formatCurrency(monthExpense)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center"><TrendingUp size={14} className="text-indigo-600" /></div></div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Balance</p>
          <p className={cn('text-base font-bold', monthIncome - monthExpense >= 0 ? 'text-indigo-600' : 'text-red-600')}>{formatCurrency(monthIncome - monthExpense)}</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-3">
        <button onClick={() => { setShowModal(true); playSound('click') }}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
          <Plus size={18} /> Nuevo movimiento
        </button>
        <Link to="/debts" className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <CreditCard size={18} className="text-gray-600" />
        </Link>
        <Link to="/goals" className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <Target size={18} className="text-gray-600" />
        </Link>
      </motion.div>

      {/* Category Breakdown */}
      {expenseCats.length > 0 && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Gastos del mes</h2>
            <Link to="/reports" className="text-xs text-indigo-600 font-semibold">Ver todo →</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {expenseCats.map(([name, amount], i) => {
              const cat = getCat(txs.find(t => t.type === 'expense' && getCat(t.category_id).name === name)?.category_id || '')
              const pct = monthExpense > 0 ? (amount / monthExpense) * 100 : 0
              return (
                <div key={name} className="flex items-center gap-3 p-3.5 hover:bg-gray-50/50">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: cat.color + '15' }}>{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1"><p className="text-sm font-semibold text-gray-900">{name}</p><p className="text-sm font-bold">{formatCurrency(amount)}</p></div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} /></div>
                  </div>
                  <p className="text-[10px] text-gray-400 w-8 text-right">{pct.toFixed(0)}%</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Últimos movimientos</h2>
          <Link to="/transactions" className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5">Ver todo <ChevronRight size={12} /></Link>
        </div>
        {loading ? <div className="text-center py-8 text-gray-300">Cargando...</div>
          : txs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p className="text-4xl mb-2">💸</p><p className="text-gray-400 font-medium">Agrega tu primer movimiento</p>
              <button onClick={() => setShowModal(true)} className="mt-3 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg">Agregar ahora</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {txs.slice(0, 8).map((tx, i) => {
                const cat = getCat(tx.category_id)
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: cat.color + '15' }}>{cat.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                        <p className="text-[11px] text-gray-400">{cat.name} • {formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-bold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg">
                        <X size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </motion.div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-[2rem] lg:rounded-3xl w-full lg:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-6 pt-5 pb-3 border-b border-gray-100 z-10 flex items-center justify-between">
                <h3 className="text-lg font-bold">Nuevo movimiento</h3>
                <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                  {[{ k: 'expense', l: '💸 Gasto', c: 'bg-red-500 text-white shadow-md' }, { k: 'income', l: '💰 Ingreso', c: 'bg-emerald-500 text-white shadow-md' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k, category_id: '' })}
                      className={cn('flex-1 py-3 rounded-lg font-bold text-sm', form.type === t.k ? t.c : 'text-gray-500')}>{t.l}</button>
                  ))}
                </div>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder={form.type === 'expense' ? '¿En qué gastaste?' : '¿De dónde viene?'}
                  className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm focus:border-indigo-400" />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00" className="w-full h-14 rounded-xl border border-gray-200 pl-10 pr-4 text-2xl font-black focus:border-indigo-400" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(form.type === 'expense'
                    ? [{ id: 'food', name: 'Comida', icon: '🍔', color: '#EF4444' }, { id: 'transport', name: 'Transporte', icon: '🚗', color: '#F59E0B' }, { id: 'home', name: 'Vivienda', icon: '🏠', color: '#8B5CF6' }, { id: 'fun', name: 'Ocio', icon: '🎮', color: '#EC4899' }, { id: 'health', name: 'Salud', icon: '💊', color: '#10B981' }, { id: 'edu', name: 'Edu', icon: '📚', color: '#3B82F6' }, { id: 'super', name: 'Super', icon: '🛒', color: '#14B8A6' }, { id: 'other_expense', name: 'Otros', icon: '📦', color: '#78716C' }]
                    : [{ id: 'salary', name: 'Salario', icon: '💼', color: '#10B981' }, { id: 'freelance', name: 'Freelance', icon: '💻', color: '#06B6D4' }, { id: 'business', name: 'Negocio', icon: '🏪', color: '#F59E0B' }, { id: 'invest', name: 'Inversión', icon: '📈', color: '#8B5CF6' }, { id: 'other_income', name: 'Otros', icon: '💰', color: '#64748B' }]
                  ).map(c => (
                    <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })}
                      className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl', form.category_id === c.id ? 'bg-indigo-50 ring-2 ring-indigo-400' : 'bg-gray-50')}>
                      <span className="text-xl">{c.icon}</span><span className="text-[9px] text-gray-600">{c.name}</span>
                    </button>
                  ))}
                </div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm" />
                <button onClick={addTx} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-200">Guardar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
