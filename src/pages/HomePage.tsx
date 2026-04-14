import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, ChevronRight, Plus, Shield, Target, Wallet, ReceiptText, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, playSound, cn } from '@/lib/data'
import { calcFlowScore } from '@/lib/flowScore'
import { generateCoachAlerts } from '@/lib/flowCoach'
import { EmptyState } from '@/components/UI'
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
  const coachAlerts = useMemo(() => generateCoachAlerts(txs, debts, budgets, profile ?? undefined), [txs, debts, budgets, profile])

  const catData = useMemo(() => {
    const map: Record<string, number> = {}
    mTxs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id ?? undefined); map[c.id] = (map[c.id] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, value]) => ({ ...getCat(id), value }))
  }, [mTxs])

  if (!profile) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-[3px] border-gray-200 border-t-emerald-500 rounded-full animate-spin" /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-8 max-w-2xl mx-auto px-4 lg:px-0">
      {/* Welcome Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-micro">{now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-heading mt-0.5">Hola, {profile.name?.split(' ')[0] || 'Usuario'}</h1>
        </div>
        <Link to="/transactions?add=true" onClick={() => playSound('click')} className="btn-primary hidden lg:flex">
          <Plus size={16} /> Agregar
        </Link>
      </div>

      {/* Balance Card — Hero */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 300 }}
        className="relative overflow-hidden rounded-[20px] p-6 text-white shadow-2xl shadow-emerald-600/20"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #14B8A6 100%)' }}
      >
        {/* Decorative shapes */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full" />
        <div className="absolute bottom-6 right-12 w-1.5 h-1.5 bg-white/20 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Wallet size={16} className="text-white/90" />
            </div>
            <p className="text-sm font-medium text-white/70">Balance de {now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
          </div>

          <p className="text-[36px] lg:text-4xl font-extrabold tracking-tight mb-5" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {formatCurrency(balance, profile.currency)}
          </p>

          <div className="flex gap-3">
            <div className="flex-1 bg-white/12 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 bg-emerald-300/30 rounded-full flex items-center justify-center">
                  <ArrowUpRight size={10} className="text-emerald-200" />
                </div>
                <p className="text-[11px] font-medium text-white/60">Ingresos</p>
              </div>
              <p className="text-base font-bold">{formatCurrency(mIncome, profile.currency)}</p>
            </div>
            <div className="flex-1 bg-white/12 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 bg-red-300/20 rounded-full flex items-center justify-center">
                  <ArrowDownRight size={10} className="text-red-200" />
                </div>
                <p className="text-[11px] font-medium text-white/60">Gastos</p>
              </div>
              <p className="text-base font-bold">{formatCurrency(mExpense, profile.currency)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Flow Coach Banner */}
      <FlowCoachBanner alerts={coachAlerts} />

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          { icon: ReceiptText, label: 'Movimientos', path: '/transactions', gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
          { icon: Target, label: 'Metas', path: '/goals', gradient: 'from-teal-500 to-cyan-500', shadow: 'shadow-teal-500/20' },
          { icon: Wallet, label: 'Deudas', path: '/debts', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
          { icon: Shield, label: 'Presupuestos', path: '/budgets', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
        ].map((item, i) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => playSound('click')}
            className="group card p-4 active:scale-[0.96] transition-all duration-200 cursor-pointer"
          >
            <motion.div whileTap={{ scale: 0.95 }}>
              <div className={cn(
                'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-md transition-shadow duration-200 group-hover:shadow-lg',
                item.gradient,
                item.shadow
              )}>
                <item.icon size={18} className="text-white" />
              </div>
              <p className="text-sm font-semibold text-[var(--text)]">{item.label}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* FlowScore Card */}
      <FlowScoreCard score={flowScore} />

      {/* Flow Coach Feed */}
      {coachAlerts.length > 0 && <FlowCoachFeed alerts={coachAlerts} />}

      {/* Category Breakdown */}
      {catData.length > 0 && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
          className="card overflow-hidden"
        >
          <div className="card-header">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-title">Gastos del mes</h2>
            </div>
            <Link to="/reports" className="text-caption hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-0.5 transition-colors font-medium">
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
                          <span className="text-base">{cat.emoji}</span>
                          <span className="text-xs font-medium text-[var(--text-secondary)]">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--text)]">{formatCurrency(cat.value, profile.currency)}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-[var(--bg-input)] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
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
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <ReceiptText size={14} className="text-gray-500" />
            </div>
            <h2 className="text-title">Últimos movimientos</h2>
          </div>
          <Link to="/transactions" className="text-caption hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-0.5 transition-colors font-medium">
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
          <div className="card overflow-hidden divide-y divide-[var(--border)]">
            {txs.slice(0, 5).map((tx, i) => {
              const cat = getCat(tx.category_id ?? undefined)
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-transform group-hover:scale-110 duration-200"
                      style={{ backgroundColor: cat.color + '18' }}
                    >
                      {cat.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{tx.description}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{cat.name} · {formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-bold tabular-nums ml-3 transition-colors',
                    tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text)]'
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile.currency)}
                  </span>
                </motion.div>
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
