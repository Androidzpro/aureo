import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Plus, X, ChevronRight, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, calcScore, getInsights, type Insight, playSound, cn } from '@/lib/data'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function HomePage() {
  const { user } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load() }, [user?.id])

  const load = async () => {
    if (!user?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(50)
    if (data) setTxs(data)
    const d = localStorage.getItem(`ff-debts-${user.id}`)
    if (d) setDebts(JSON.parse(d))
    setLoading(false)
  }

  const now = new Date()
  const mTxs = useMemo(() => txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }), [txs])
  const mIncome = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const mExpense = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const score = calcScore(txs)
  const insights = getInsights(txs)

  const catData = useMemo(() => {
    const map: Record<string, number> = {}
    mTxs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); map[c.name] = (map[c.name] || 0) + t.amount })
    const colors = ['#EF4444','#F59E0B','#8B5CF6','#EC4899','#10B981','#3B82F6','#6366F1','#64748B']
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
  }, [mTxs])

  const addTx = async () => {
    if (!user?.id || !form.amount || !form.description) return
    await supabase.from('transactions').insert([{ user_id: user.id, type: form.type, amount: parseFloat(form.amount), description: form.description, category_id: form.category_id || '', date: new Date(form.date).toISOString() }])
    setShowAdd(false); setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] }); load()
  }

  const deleteTx = async (id: string) => { await supabase.from('transactions').delete().eq('id', id); load() }

  const insightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
      case 'warning': return <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
      case 'success': return <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
      default: return <Info size={14} className="text-blue-500 flex-shrink-0" />
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-8">
      {/* Balance Card */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-5 text-white relative overflow-hidden shadow-xl shadow-indigo-300/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-medium mb-1">Balance del mes</p>
          <p className="text-3xl font-black tracking-tight">{formatCurrency(mIncome - mExpense)}</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2.5 py-1.5">
              <ArrowUpRight size={12} className="text-emerald-300" />
              <span className="text-xs font-medium">{formatCurrency(mIncome)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2.5 py-1.5">
              <ArrowDownRight size={12} className="text-red-300" />
              <span className="text-xs font-medium">{formatCurrency(mExpense)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm',
              score >= 70 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : score >= 40 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-600')}>
              {score}%
            </div>
            <div><p className="text-xs font-medium text-gray-900 dark:text-white">Salud financiera</p><p className="text-[10px] text-gray-400">{score >= 70 ? 'Excelente' : score >= 40 ? 'Puede mejorar' : 'Necesita atención'}</p></div>
          </div>
          <Link to="/reports" className="text-gray-400"><ChevronRight size={16} /></Link>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-3"><div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all" style={{ width: `${score}%` }} /></div>
      </div>

      {/* Coach Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.slice(0, 2).map((insight, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              className={cn('rounded-xl p-3 border flex items-start gap-2.5',
                insight.type === 'alert' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' :
                insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20' :
                insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20' :
                'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20')}>
              <div className="mt-0.5">{insightIcon(insight.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{insight.title}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{insight.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Category Breakdown */}
      {catData.length > 0 && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Gastos del mes</h2>
            <Link to="/reports" className="text-[10px] text-gray-400">Ver todo →</Link>
          </div>
          <div className="flex items-center gap-4 p-4">
            {/* Donut Chart */}
            <div className="w-20 h-20 flex-shrink-0">
              <ResponsiveContainer width={80} height={80}>
                <PieChart><Pie data={catData} cx={40} cy={40} innerRadius={25} outerRadius={36} dataKey="value" stroke="none">
                  {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {catData.slice(0, 3).map(cat => {
                const pct = mExpense > 0 ? (cat.value / mExpense) * 100 : 0
                return (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-[11px] text-gray-600 dark:text-gray-300">{cat.name}</span></div>
                    <span className="text-[11px] font-medium text-gray-900 dark:text-white">{formatCurrency(cat.value)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recientes</h2>
          <Link to="/transactions" className="text-[10px] text-gray-400">Ver todo →</Link>
        </div>
        {loading ? <div className="text-center py-8 text-gray-300 text-xs">Cargando...</div>
          : txs.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3"><span className="text-2xl">💸</span></div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Sin movimientos aún</p>
              <p className="text-[10px] text-gray-400 mt-1 mb-3">Registra tu primer ingreso o gasto</p>
              <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-300/30">Agregar</button>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
              {txs.slice(0, 5).map(tx => {
                const cat = getCat(tx.category_id)
                return (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3 group">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: cat.color + '15' }}>{cat.emoji}</div>
                      <div className="min-w-0"><p className="text-xs font-medium text-gray-900 dark:text-white truncate">{tx.description}</p><p className="text-[10px] text-gray-400">{cat.name} · {formatDate(tx.date)}</p></div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs font-semibold tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                      <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1"><X size={12} className="text-red-400" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        {[{ label: 'Deudas', path: '/debts', emoji: '💳' }, { label: 'Metas', path: '/goals', emoji: '🎯' }, { label: 'Calendario', path: '/calendar', emoji: '📅' }].map(item => (
          <Link key={item.path} to={item.path} className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
            <span className="text-xl">{item.emoji}</span><span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-[#1A1A1A] rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Nuevo movimiento</h3>
                <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                {/* Type toggle */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  {[{ k: 'expense', l: '💸 Gasto' }, { k: 'income', l: '💰 Ingreso' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k, category_id: '' })} className={cn('flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all', form.type === t.k ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400')}>{t.l}</button>
                  ))}
                </div>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={form.type === 'expense' ? '¿En qué gastaste?' : '¿De dónde viene?'} className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="w-full h-14 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 text-2xl font-black text-gray-900 dark:text-white placeholder:text-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
                {/* Category grid */}
                <div className="grid grid-cols-4 gap-2">
                  {(form.type === 'expense'
                    ? [{ id: 'food', name: 'Comida', emoji: '🍔' }, { id: 'transport', name: 'Transporte', emoji: '🚗' }, { id: 'home', name: 'Vivienda', emoji: '🏠' }, { id: 'fun', name: 'Ocio', emoji: '🎮' }, { id: 'health', name: 'Salud', emoji: '💊' }, { id: 'super', name: 'Super', emoji: '🛒' }, { id: 'gas', name: 'Gasolina', emoji: '⛽' }, { id: 'other_expense', name: 'Otros', emoji: '📦' }]
                    : [{ id: 'salary', name: 'Salario', emoji: '💼' }, { id: 'freelance', name: 'Freelance', emoji: '💻' }, { id: 'business', name: 'Negocio', emoji: '🏪' }, { id: 'invest', name: 'Inversión', emoji: '📈' }, { id: 'other_income', name: 'Otros', emoji: '💰' }]
                  ).map(c => (
                    <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })} className={cn('flex flex-col items-center gap-0.5 p-2.5 rounded-xl transition-all', form.category_id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                      <span className="text-xl">{c.emoji}</span><span className="text-[9px] text-gray-500 dark:text-gray-400">{c.name}</span>
                    </button>
                  ))}
                </div>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white" />
                <button onClick={addTx} className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-300/30 active:scale-[0.98] transition-all text-sm">Guardar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
