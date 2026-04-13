import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, ChevronRight, Plus, TrendingUp, TrendingDown, Shield, Target, Wallet, ReceiptText } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, playSound, cn } from '@/lib/data'
import { calcFlowScore } from '@/lib/flowScore'
import { generateCoachAlerts } from '@/lib/flowCoach'
import { ConfirmDialog, EmptyState } from '@/components/UI'
import { FlowScoreCard } from '@/components/FlowScoreCard'
import { FlowCoachBanner, FlowCoachFeed } from '@/components/FlowCoachFeed'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { Transaction, Debt, Budget } from '@/types'

export default function HomePage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [profile?.id])

  const loadAll = async () => {
    if (!profile?.id) { setLoading(false); return }
    try {
      const [txRes, debtRes, budgetRes] = await Promise.allSettled([
        supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false }).limit(100),
        supabase.from('debts').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', profile.id),
      ])
      if (txRes.status === 'fulfilled' && txRes.value.data) setTxs(txRes.value.data)
      if (debtRes.status === 'fulfilled' && debtRes.value.data) setDebts(debtRes.value.data)
      if (budgetRes.status === 'fulfilled' && budgetRes.value.data) setBudgets(budgetRes.value.data)
    } catch (e) { console.error('Load error:', e) }
    finally { setLoading(false) }
  }

  const now = new Date()
  const mTxs = useMemo(() => txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }), [txs])
  const mIncome = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const mExpense = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = mIncome - mExpense
  const flowScore = calcFlowScore(txs, debts, profile?.monthly_income, profile?.goal_type)
  const coachAlerts = useMemo(() => generateCoachAlerts(txs, debts, budgets, profile), [txs, debts, budgets, profile])

  const catData = useMemo(() => {
    const map: Record<string, number> = {}
    mTxs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); map[c.id] = (map[c.id] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, value]) => ({ ...getCat(id), value }))
  }, [mTxs])

  if (!profile) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-[var(--gray-200)] border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-micro">Bienvenido</p>
          <h1 className="text-heading">{profile.name?.split(' ')[0]}</h1>
        </div>
        <Link to="/transactions?add=true" onClick={() => playSound('click')} className="btn-primary hidden lg:flex">
          <Plus size={16} /> Nuevo
        </Link>
      </div>

      {/* Balance Card — Hero */}
      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-white/70" />
            <p className="text-xs font-medium text-white/70">Balance del mes</p>
          </div>
          <p className="text-4xl font-bold tracking-tight mb-4">{formatCurrency(balance, profile.currency)}</p>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <ArrowUpRight size={12} className="text-emerald-300" />
                <p className="text-[10px] font-medium text-white/60">Ingresos</p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(mIncome, profile.currency)}</p>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <ArrowDownRight size={12} className="text-red-300" />
                <p className="text-[10px] font-medium text-white/60">Gastos</p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(mExpense, profile.currency)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Flow Coach Banner */}
      <FlowCoachBanner alerts={coachAlerts} />

      {/* Quick Actions Grid */}
      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: ReceiptText, label: 'Movimientos', path: '/transactions', color: 'from-blue-500 to-cyan-500' },
          { icon: Target, label: 'Metas', path: '/goals', color: 'from-emerald-500 to-teal-500' },
          { icon: Wallet, label: 'Deudas', path: '/debts', color: 'from-amber-500 to-orange-500' },
          { icon: Shield, label: 'Presupuestos', path: '/budgets', color: 'from-violet-500 to-purple-500' },
        ].map((item, i) => (
          <Link key={item.path} to={item.path} onClick={() => playSound('click')}
            className="card p-4 group hover:border-[var(--gray-200)] dark:hover:border-[var(--gray-700)] active:scale-[0.98] transition-all">
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br', item.color, 'flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow')}>
              <item.icon size={18} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-[var(--gray-900)] dark:text-white">{item.label}</p>
          </Link>
        ))}
      </motion.div>

      {/* FlowScore Card */}
      <FlowScoreCard score={flowScore} />

      {/* Flow Coach Feed */}
      {coachAlerts.length > 0 && <FlowCoachFeed alerts={coachAlerts} />}

      {/* Category Breakdown */}
      {catData.length > 0 && (
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-title">Gastos del mes</h2>
            <Link to="/reports" className="text-caption hover:text-[var(--gray-700)] dark:hover:text-[var(--gray-300)] flex items-center gap-0.5 transition-colors">
              Ver todo <ChevronRight size={12} />
            </Link>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-5">
              {/* Donut Chart */}
              <div className="w-20 h-20 flex-shrink-0">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={catData} cx={40} cy={40} innerRadius={25} outerRadius={36} dataKey="value" stroke="none">
                      {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {catData.slice(0, 4).map(cat => {
                  const pct = mExpense > 0 ? (cat.value / mExpense) * 100 : 0
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat.emoji}</span>
                          <span className="text-xs font-medium text-[var(--gray-700)] dark:text-[var(--gray-300)]">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--gray-900)] dark:text-white">{formatCurrency(cat.value, profile.currency)}</span>
                          <span className="text-[10px] text-[var(--gray-400)]">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-[var(--gray-100)] dark:bg-[var(--gray-800)] rounded-full h-1">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-title">Recientes</h2>
          <Link to="/transactions" className="text-caption hover:text-[var(--gray-700)] dark:hover:text-[var(--gray-300)] flex items-center gap-0.5 transition-colors">
            Ver todo <ChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 skeleton-circle" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 skeleton w-24" />
                  <div className="h-2 skeleton w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : txs.length === 0 ? (
          <EmptyState emoji="💸" title="Sin movimientos" message="Registra tu primer ingreso o gasto para comenzar" actionLabel="Agregar" />
        ) : (
          <div className="card overflow-hidden divide-y divide-[var(--gray-50)] dark:divide-[var(--gray-800)]">
            {txs.slice(0, 5).map(tx => {
              const cat = getCat(tx.category_id)
              return (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-[var(--gray-50)] dark:hover:bg-[var(--gray-800)/50] transition-colors group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: cat.color + '15' }}>{cat.emoji}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--gray-900)] dark:text-white truncate">{tx.description}</p>
                      <p className="text-[10px] text-[var(--gray-400)]">{cat.name} · {formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span className={cn('text-sm font-semibold tabular-nums ml-3', tx.type === 'income' ? 'text-emerald-600' : 'text-[var(--gray-900)] dark:text-white')}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile.currency)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function formatDate(d: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(d))
}
