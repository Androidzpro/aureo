import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, TrendingUp, X, ChevronRight, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, calcScore, getInsights, type Insight, playSound, cn } from '@/lib/data'
import { ConfirmDialog, EmptyState } from '@/components/UI'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function HomePage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [profile?.id])

  const loadAll = async () => {
    if (!profile?.id) return
    try {
      const [txRes, debtRes, budgetRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false }).limit(100),
        supabase.from('debts').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', profile.id),
      ])
      if (txRes.data) setTxs(txRes.data)
      if (debtRes.data) setDebts(debtRes.data)
      if (budgetRes.data) setBudgets(budgetRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const now = new Date()
  const mTxs = useMemo(() => txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }), [txs])
  const mIncome = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const mExpense = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const score = calcScore(txs, debts, profile?.monthly_income || undefined)
  const insights = getInsights(txs, debts, budgets, profile?.currency || 'MXN')

  const catData = useMemo(() => {
    const map: Record<string, number> = {}
    mTxs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); map[c.id] = (map[c.id] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, value]) => ({ ...getCat(id), value }))
  }, [mTxs])

  const insightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
      case 'warning': return <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
      case 'success': return <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
      default: return <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
    }
  }

  if (!profile?.onboarded) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      {/* Balance Card */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-5 text-white relative overflow-hidden shadow-xl shadow-indigo-300/30 dark:shadow-indigo-900/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-medium mb-1">Balance del mes</p>
          <p className="text-3xl font-black tracking-tight">{formatCurrency(mIncome - mExpense, profile.currency)}</p>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2.5 py-1.5">
              <ArrowUpRight size={11} className="text-emerald-300" />
              <span className="text-xs font-medium">{formatCurrency(mIncome, profile.currency)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2.5 py-1.5">
              <ArrowDownRight size={11} className="text-red-300" />
              <span className="text-xs font-medium">{formatCurrency(mExpense, profile.currency)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
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
          {insights.slice(0, 3).map((insight, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className={cn('rounded-xl p-3 border flex items-start gap-2.5',
                insight.type === 'alert' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' :
                insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20' :
                insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20' :
                'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20')}>
              <div>{insightIcon(insight.type)}</div>
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Gastos del mes</h2>
            <Link to="/reports" className="text-[10px] text-gray-400">Ver todo →</Link>
          </div>
          <div className="flex items-center gap-4 p-4">
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
                  <div key={cat.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-[11px] text-gray-600 dark:text-gray-300">{cat.name}</span></div>
                    <span className="text-[11px] font-medium text-gray-900 dark:text-white">{formatCurrency(cat.value, profile.currency)}</span>
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
        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="flex items-center gap-3 p-3"><div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" /><div className="flex-1"><div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-1 animate-pulse" /><div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-16 animate-pulse" /></div></div>)}</div>
          : txs.length === 0 ? <EmptyState emoji="💸" title="Sin movimientos" message="Registra tu primer ingreso o gasto para comenzar" actionLabel="Agregar" />
            : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                {txs.slice(0, 5).map(tx => {
                  const cat = getCat(tx.category_id)
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: cat.color + '15' }}>{cat.emoji}</div>
                        <div className="min-w-0"><p className="text-xs font-medium text-gray-900 dark:text-white truncate">{tx.description}</p><p className="text-[10px] text-gray-400">{cat.name} · {formatDate(tx.date)}</p></div>
                      </div>
                      <span className={cn('text-xs font-semibold tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile.currency)}</span>
                    </div>
                  )
                })}
              </div>
            )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        {[{ label: 'Deudas', path: '/debts', emoji: '💳' }, { label: 'Metas', path: '/goals', emoji: '🎯' }, { label: 'Calendario', path: '/calendar', emoji: '📅' }].map(item => (
          <Link key={item.path} to={item.path} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
            <span className="text-xl">{item.emoji}</span><span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
