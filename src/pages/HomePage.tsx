import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, ArrowUpRight, ArrowDownRight, X, ChevronRight, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, calcHealthScore, getFinancialInsights, type FinancialInsight, playSound, cn } from '@/lib/data'

export default function HomePage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load() }, [profile?.id])

  const load = async () => {
    if (!profile?.id) return
    const [txRes, debtRes, budgetRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false }).limit(100),
      Promise.resolve(JSON.parse(localStorage.getItem(`ff-debts-${profile.id}`) || '[]')),
      Promise.resolve([]), // budgets vendría de la DB
    ])
    if (txRes.data) setTxs(txRes.data)
    setDebts(debtRes)
  }

  const now = new Date()
  const monthTxs = useMemo(() => txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }), [txs])
  const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const score = calcHealthScore(txs, debts)
  const insights = getFinancialInsights(txs, budgets, debts)

  const prevMonthIncome = useMemo(() => {
    const pm = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    return txs.filter(t => { const d = new Date(t.date); return d.getMonth() === pm && d.getFullYear() === py && t.type === 'income' }).reduce((s, t) => s + t.amount, 0)
  }, [txs])

  const addTx = async () => {
    if (!profile?.id || !form.amount || !form.description) return
    await supabase.from('transactions').insert([{ user_id: profile.id, type: form.type, amount: parseFloat(form.amount), description: form.description, category_id: form.category_id || '', date: new Date(form.date).toISOString() }])
    setShowModal(false); setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] }); load()
  }
  const deleteTx = async (id: string) => { await supabase.from('transactions').delete().eq('id', id); load() }

  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); map[c.id] = (map[c.id] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, amount]) => ({ ...getCat(id), amount }))
  }, [monthTxs])

  const insightIcon = (type: FinancialInsight['type']) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={16} className="text-red-500" />
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />
      default: return <Info size={16} className="text-blue-500" />
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] tracking-tight">Dashboard</h1>
          <p className="text-xs text-[#707070] mt-0.5">{now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => { setShowModal(true); playSound('click') }} className="btn-primary flex items-center gap-1.5"><Plus size={14} /> Nuevo</button>
      </div>

      {/* Health Score + Insights */}
      <div className={cn('rounded-xl p-4 text-white relative overflow-hidden', score >= 70 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : score >= 40 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-600')}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1"><Sparkles size={12} className="text-white/60" /><span className="text-white/60 text-xs font-medium uppercase tracking-wider">Salud financiera</span></div>
            <p className="text-3xl font-bold">{score}%</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-white/70 text-xs">Ahorro: <b>{monthIncome > 0 ? (((monthIncome - monthExpense) / monthIncome) * 100).toFixed(0) : 0}%</b></p>
            {prevMonthIncome > 0 && <p className="text-white/70 text-xs">{monthIncome >= prevMonthIncome ? '↑' : '↓'} vs mes anterior</p>}
          </div>
        </div>
        <div className="mt-3 w-full bg-white/20 rounded-full h-1.5"><motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: 0.2, duration: 0.8 }} className="h-1.5 rounded-full bg-white/80" /></div>
      </div>

      {/* Coach Financiero - Insights */}
      {insights.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-[#A0A0A0] uppercase tracking-[0.04em] mb-2 flex items-center gap-1.5"><Sparkles size={12} /> Tu coach financiero</h2>
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className={cn('rounded-lg p-3 border flex items-start gap-3',
                  insight.type === 'alert' ? 'bg-red-50/50 border-red-100' :
                  insight.type === 'warning' ? 'bg-amber-50/50 border-amber-100' :
                  insight.type === 'success' ? 'bg-emerald-50/50 border-emerald-100' :
                  'bg-blue-50/50 border-blue-100')}>
                <div className="mt-0.5 flex-shrink-0">{insightIcon(insight.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1A1A1A]">{insight.title}</p>
                  <p className="text-xs text-[#5C5C5C] mt-0.5 leading-relaxed">{insight.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4"><p className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-[0.04em] mb-1">Ingresos</p><p className="text-lg font-semibold text-[#1A1A1A]">{formatCurrency(monthIncome)}</p><div className="flex items-center gap-1 mt-1.5"><div className="w-3.5 h-3.5 rounded bg-emerald-50 flex items-center justify-center"><ArrowUpRight size={9} className="text-emerald-600" /></div><span className="text-[10px] text-[#A0A0A0]">este mes</span></div></div>
        <div className="card p-4"><p className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-[0.04em] mb-1">Gastos</p><p className="text-lg font-semibold text-[#1A1A1A]">{formatCurrency(monthExpense)}</p><div className="flex items-center gap-1 mt-1.5"><div className="w-3.5 h-3.5 rounded bg-red-50 flex items-center justify-center"><ArrowDownRight size={9} className="text-red-600" /></div><span className="text-[10px] text-[#A0A0A0]">este mes</span></div></div>
      </div>

      {/* Expense Breakdown */}
      {expenseBreakdown.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F0F0F0]"><h2 className="text-xs font-medium text-[#1A1A1A]">Gastos del mes</h2><Link to="/reports" className="text-[10px] text-[#707070] hover:text-[#1A1A1A] transition-colors">Ver todo →</Link></div>
          <div className="divide-y divide-[#F0F0F0]">
            {expenseBreakdown.map(cat => {
              const pct = monthExpense > 0 ? (cat.amount / monthExpense) * 100 : 0
              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: cat.color + '12' }}>{cat.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1"><p className="text-xs font-medium text-[#1A1A1A] truncate">{cat.name}</p><p className="text-xs font-medium tabular-nums text-[#5C5C5C]">{formatCurrency(cat.amount)}</p></div>
                    <div className="w-full bg-[#F0F0F0] rounded-full h-1"><div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} /></div>
                  </div>
                  <p className="text-[10px] text-[#A0A0A0] w-8 text-right">{pct.toFixed(0)}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-[#A0A0A0] uppercase tracking-[0.04em]">Últimos movimientos</h2>
          <Link to="/transactions" className="text-[10px] text-[#707070] hover:text-[#1A1A1A] transition-colors flex items-center gap-0.5">Ver todo <ChevronRight size={10} /></Link>
        </div>
        {txs.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center mb-3"><span className="text-lg">💸</span></div>
            <p className="text-xs font-medium text-[#707070] mb-1">Sin movimientos aún</p>
            <p className="text-[10px] text-[#A0A0A0] mb-3">Empieza registrando tu primer ingreso o gasto</p>
            <button onClick={() => setShowModal(true)} className="btn-primary text-xs">Agregar movimiento</button>
          </div>
        ) : (
          <div className="card overflow-hidden divide-y divide-[#F0F0F0]">
            {txs.slice(0, 6).map(tx => {
              const cat = getCat(tx.category_id)
              return (
                <div key={tx.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FAFAFA] transition-colors group">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: cat.color + '12' }}>{cat.emoji}</div>
                    <div className="min-w-0"><p className="text-xs font-medium text-[#1A1A1A] truncate">{tx.description}</p><p className="text-[10px] text-[#A0A0A0]">{cat.name} · {formatDate(tx.date)}</p></div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-medium tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-[#1A1A1A]')}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                    <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"><X size={12} className="text-red-400" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-2">
        {[{ label: 'Deudas', path: '/debts', icon: '💳' }, { label: 'Metas', path: '/goals', icon: '🎯' }, { label: 'Calendario', path: '/calendar', icon: '📅' }].map(item => (
          <Link key={item.path} to={item.path} className="card p-3 flex flex-col items-center gap-1.5 hover:border-[#D4D4D4] transition-colors">
            <span className="text-lg">{item.icon}</span><span className="text-[10px] font-medium text-[#5C5C5C]">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-white rounded-xl w-full lg:max-w-md shadow-2xl border border-[#EAEAEA] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA]"><h3 className="text-sm font-medium text-[#1A1A1A]">Nuevo movimiento</h3><button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[#F5F5F5] rounded-md"><X size={14} className="text-[#707070]" /></button></div>
              <div className="p-4 space-y-4">
                <div className="flex gap-1 bg-[#F5F5F5] rounded-md p-0.5">
                  {[{ k: 'expense', l: '💸 Gasto' }, { k: 'income', l: '💰 Ingreso' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k, category_id: '' })} className={cn('flex-1 py-2 rounded text-xs font-medium transition-all', form.type === t.k ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#707070]')}>{t.l}</button>
                  ))}
                </div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Descripción</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={form.type === 'expense' ? 'Ej: Supermercado' : 'Ej: Salario'} className="input" /></div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Monto</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-sm">$</span><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" className="input pl-7 font-medium" /></div></div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-2 block">Categoría</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(form.type === 'expense'
                      ? [{ id: 'food', name: 'Comida', emoji: '🍔' }, { id: 'transport', name: 'Transporte', emoji: '🚗' }, { id: 'home', name: 'Vivienda', emoji: '🏠' }, { id: 'fun', name: 'Ocio', emoji: '🎮' }, { id: 'health', name: 'Salud', emoji: '💊' }, { id: 'super', name: 'Super', emoji: '🛒' }, { id: 'gas', name: 'Gasolina', emoji: '⛽' }, { id: 'other_expense', name: 'Otros', emoji: '📦' }]
                      : [{ id: 'salary', name: 'Salario', emoji: '💼' }, { id: 'freelance', name: 'Freelance', emoji: '💻' }, { id: 'business', name: 'Negocio', emoji: '🏪' }, { id: 'invest', name: 'Inversión', emoji: '📈' }, { id: 'other_income', name: 'Otros', emoji: '💰' }]
                    ).map(c => (
                      <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })} className={cn('flex flex-col items-center gap-0.5 p-2 rounded-md text-xs transition-all', form.category_id === c.id ? 'bg-[#F0F0F0] text-[#1A1A1A] font-medium' : 'bg-white hover:bg-[#F5F5F5] text-[#5C5C5C]')}>
                        <span className="text-base">{c.emoji}</span><span className="text-[9px]">{c.name}</span></button>
                    ))}
                  </div>
                </div>
                <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Fecha</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" /></div>
                <div className="flex gap-2"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-xs">Cancelar</button><button onClick={addTx} className="btn-primary flex-1 text-xs">Guardar</button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
