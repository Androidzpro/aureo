import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, ArrowUpRight, ArrowDownRight, X, Calendar, Lightbulb, ChevronRight, Menu, Filter } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, analyzeFinances, FINANCIAL_TIPS, sounds, getCategory, cn } from '@/lib/data'

export default function HomePage() {
  const { user } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTxModal, setShowTxModal] = useState(false)
  const [showTip, setShowTip] = useState(true)
  const [txForm, setTxForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load(); }, [user?.id])

  const load = async () => {
    if (!user?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100)
    if (data) setTxs(data)
    setLoading(false)
  }

  const analysis = useMemo(() => analyzeFinances(txs), [txs])

  const monthTxs = useMemo(() => {
    const now = new Date()
    return txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  }, [txs])

  const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const addTx = async () => {
    if (!user?.id || !txForm.amount || !txForm.description) return
    await supabase.from('transactions').insert([{
      user_id: user.id, type: txForm.type, amount: parseFloat(txForm.amount),
      description: txForm.description, category_id: txForm.category_id || '',
      date: new Date(txForm.date).toISOString(), notes: '',
    }])
    sounds.success()
    setShowTxModal(false)
    setTxForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const deleteTx = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    sounds.delete()
    load()
  }

  const tip = FINANCIAL_TIPS[new Date().getDate() % FINANCIAL_TIPS.length]

  const expenseCats = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'expense').forEach(t => { const c = getCategory(t.category_id); map[c.name] = (map[c.name] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [monthTxs])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Hola, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-400 text-sm mt-0.5">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Health Score */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className={cn('rounded-2xl p-5 text-white relative overflow-hidden',
          analysis.score >= 70 ? 'gradient-success' : analysis.score >= 40 ? 'gradient-warm' : 'gradient-danger')}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Salud financiera</p>
            <p className="text-4xl font-black">{analysis.score}%</p>
            <p className="text-white/70 text-xs mt-1">{analysis.health}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-white/80 text-xs">Ahorro: <b>{analysis.savingsRate.toFixed(0)}%</b></p>
            <p className="text-white/80 text-xs">Categoría top: <b>{analysis.topCategory}</b></p>
            <p className="text-white/80 text-xs">Gasto diario: <b>{formatCurrency(analysis.avgDaily)}</b></p>
          </div>
        </div>
        {/* Score bar */}
        <div className="mt-4 w-full bg-white/20 rounded-full h-2 relative z-10">
          <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.score}%` }} transition={{ delay: 0.3, duration: 1 }}
            className="h-2 rounded-full bg-white/80" />
        </div>
      </motion.div>

      {/* Tip */}
      {showTip && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">{tip.title}</p>
            <p className="text-xs text-amber-600 mt-0.5">{tip.desc}</p>
          </div>
          <button onClick={() => setShowTip(false)} className="p-1 hover:bg-amber-100 rounded-lg"><X size={14} className="text-amber-400" /></button>
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 card-hover">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Ingresos</p>
          <p className="text-base font-bold text-emerald-600">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 card-hover">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Gastos</p>
          <p className="text-base font-bold text-red-600">{formatCurrency(monthExpense)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 card-hover">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Balance</p>
          <p className={cn('text-base font-bold', monthIncome - monthExpense >= 0 ? 'text-indigo-600' : 'text-red-600')}>{formatCurrency(monthIncome - monthExpense)}</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-3">
        <button onClick={() => { setShowTxModal(true); sounds.click() }}
          className="flex-1 gradient-primary text-white font-semibold h-12 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
          <Plus size={18} /> Nuevo movimiento
        </button>
        <Link to="/calendar" className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center card-hover shadow-sm">
          <Calendar size={18} className="text-gray-600" />
        </Link>
        <Link to="/reports" className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center card-hover shadow-sm">
          <Filter size={18} className="text-gray-600" />
        </Link>
      </motion.div>

      {/* Category breakdown */}
      {expenseCats.length > 0 && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Gastos por categoría</h2>
            <Link to="/reports" className="text-xs text-indigo-600 font-semibold">Ver todo →</Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {expenseCats.map(([name, amount], i) => {
              const cat = getCategory(txs.find(t => t.type === 'expense' && getCategory(t.category_id).name === name)?.category_id || '')
              const pct = monthExpense > 0 ? (amount / monthExpense) * 100 : 0
              return (
                <div key={name} className="flex items-center gap-3 p-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: cat.color + '15' }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(amount)}</p>
                    <p className="text-[10px] text-gray-400">{pct.toFixed(0)}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Recent transactions */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Últimos movimientos</h2>
          <Link to="/transactions" className="text-xs text-indigo-600 font-semibold">Ver todo <ChevronRight size={12} className="inline" /></Link>
        </div>
        {loading ? <div className="text-center py-8 text-gray-300">Cargando...</div>
          : txs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-4xl mb-2">💸</p>
              <p className="text-gray-400 text-sm">Agrega tu primer movimiento</p>
              <button onClick={() => setShowTxModal(true)} className="mt-3 px-5 py-2 gradient-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200">
                Agregar ahora
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <AnimatePresence>
                {txs.slice(0, 10).map((tx, i) => {
                  const cat = getCategory(tx.category_id)
                  return (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: cat.color + '15' }}>
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                          <p className="text-[11px] text-gray-400">{cat.name} • {formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-bold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg">
                          <X size={14} className="text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
      </motion.div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTxModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowTxModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-6 pt-4 pb-3 border-b border-gray-100 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Nuevo movimiento</h3>
                  <button onClick={() => setShowTxModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} className="text-gray-400" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Type toggle */}
                <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                  {[{ k: 'expense', l: '💸 Gasto', c: 'bg-red-500 text-white' }, { k: 'income', l: '💰 Ingreso', c: 'bg-emerald-500 text-white' }].map(t => (
                    <button key={t.k} onClick={() => setTxForm({ ...txForm, type: t.k })}
                      className={cn('flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all',
                        txForm.type === t.k ? t.c : 'text-gray-500')}>{t.l}</button>
                  ))}
                </div>

                <div>
                  <input value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                    placeholder="¿En qué gastaste?" className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm focus:border-indigo-400" />
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input type="number" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    placeholder="0.00" className="w-full h-12 rounded-xl border border-gray-200 pl-8 pr-4 text-lg font-bold focus:border-indigo-400" />
                </div>

                {/* Category picker */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Categoría</p>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.filter(c => c.type === txForm.type).map(c => (
                      <button key={c.id} onClick={() => setTxForm({ ...txForm, category_id: c.id })}
                        className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all text-xs',
                          txForm.category_id === c.id ? 'bg-indigo-50 ring-2 ring-indigo-400 scale-95' : 'bg-gray-50 hover:bg-gray-100')}>
                        <span className="text-xl">{c.icon}</span>
                        <span className="text-[10px] text-gray-600 leading-tight">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Fecha</p>
                  <input type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm" />
                </div>

                <button onClick={addTx} className="w-full gradient-primary text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-200 text-base">
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Categories
const CATEGORIES = [
  { id: 'cat_food', name: 'Comida', type: 'expense', color: '#EF4444', icon: '🍔' },
  { id: 'cat_transport', name: 'Transporte', type: 'expense', color: '#F59E0B', icon: '🚗' },
  { id: 'cat_home', name: 'Vivienda', type: 'expense', color: '#8B5CF6', icon: '🏠' },
  { id: 'cat_fun', name: 'Ocio', type: 'expense', color: '#EC4899', icon: '🎮' },
  { id: 'cat_health', name: 'Salud', type: 'expense', color: '#10B981', icon: '💊' },
  { id: 'cat_education', name: 'Edu', type: 'expense', color: '#3B82F6', icon: '📚' },
  { id: 'cat_clothes', name: 'Ropa', type: 'expense', color: '#6366F1', icon: '👕' },
  { id: 'cat_services', name: 'Servicios', type: 'expense', color: '#64748B', icon: '⚡' },
  { id: 'cat_restaurant', name: 'Rest.', type: 'expense', color: '#F97316', icon: '☕' },
  { id: 'cat_super', name: 'Super', type: 'expense', color: '#14B8A6', icon: '🛒' },
  { id: 'cat_gas', name: 'Gasolina', type: 'expense', color: '#D97706', icon: '⛽' },
  { id: 'cat_beauty', name: 'Belleza', type: 'expense', color: '#E11D48', icon: '✨' },
  { id: 'cat_gifts', name: 'Regalos', type: 'expense', color: '#7C3AED', icon: '🎁' },
  { id: 'cat_other_exp', name: 'Otros', type: 'expense', color: '#78716C', icon: '📦' },
  { id: 'cat_salary', name: 'Salario', type: 'income', color: '#10B981', icon: '💼' },
  { id: 'cat_freelance', name: 'Freelance', type: 'income', color: '#06B6D4', icon: '💻' },
  { id: 'cat_business', name: 'Negocio', type: 'income', color: '#F59E0B', icon: '🏪' },
  { id: 'cat_invest', name: 'Inversión', type: 'income', color: '#8B5CF6', icon: '📈' },
  { id: 'cat_sales', name: 'Ventas', type: 'income', color: '#D97706', icon: '🏷️' },
  { id: 'cat_other_inc', name: 'Otros', type: 'income', color: '#64748B', icon: '💰' },
]
