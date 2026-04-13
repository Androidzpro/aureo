import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, ArrowUpRight, ArrowDownRight, X, Wallet, TrendingUp, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, analyzeFinances, getCat, cn } from '@/lib/data'

export default function HomePage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => { load() }, [profile?.id])

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false }).limit(50)
    if (data) setTxs(data)
    setLoading(false)
  }

  const analysis = useMemo(() => analyzeFinances(txs), [txs])
  const now = new Date()
  const monthTxs = useMemo(() => txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }), [txs])
  const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const addTx = async () => {
    if (!profile?.id || !form.amount || !form.description) return
    await supabase.from('transactions').insert([{
      user_id: profile.id, type: form.type, amount: parseFloat(form.amount),
      description: form.description, category_id: form.category_id || '',
      date: new Date(form.date).toISOString(),
    }])
    setShowModal(false)
    setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const deleteTx = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    load()
  }

  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); map[c.id] = (map[c.id] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, amount]) => ({ ...getCat(id), amount }))
  }, [monthTxs])

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Nuevo
        </button>
      </div>

      {/* KPI Cards — Stripe style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi">
          <p className="kpi-label">Balance del mes</p>
          <p className={cn('kpi-value', monthIncome - monthExpense >= 0 ? 'text-[#1A1A1A]' : 'text-red-600')}>{formatCurrency(monthIncome - monthExpense)}</p>
          <div className="flex items-center gap-1 mt-2">
            <div className={cn('w-4 h-4 rounded-full flex items-center justify-center', monthIncome - monthExpense >= 0 ? 'bg-emerald-50' : 'bg-red-50')}>
              {monthIncome - monthExpense >= 0 ? <TrendingUp size={10} className="text-emerald-600" /> : <TrendingUp size={10} className="text-red-600 rotate-180" />}
            </div>
            <span className="text-xs text-[#707070]">{analysis.savingsRate.toFixed(0)}% ahorro</span>
          </div>
        </div>
        <div className="kpi">
          <p className="kpi-label">Ingresos</p>
          <p className="kpi-value text-[#1A1A1A]">{formatCurrency(monthIncome)}</p>
          <div className="flex items-center gap-1 mt-2">
            <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center"><ArrowUpRight size={10} className="text-emerald-600" /></div>
            <span className="text-xs text-[#707070]">este mes</span>
          </div>
        </div>
        <div className="kpi">
          <p className="kpi-label">Gastos</p>
          <p className="kpi-value text-[#1A1A1A]">{formatCurrency(monthExpense)}</p>
          <div className="flex items-center gap-1 mt-2">
            <div className="w-4 h-4 rounded-full bg-red-50 flex items-center justify-center"><ArrowDownRight size={10} className="text-red-600" /></div>
            <span className="text-xs text-[#707070]">este mes</span>
          </div>
        </div>
        <div className="kpi">
          <p className="kpi-label">Salud financiera</p>
          <p className={cn('kpi-value', analysis.score >= 60 ? 'text-[#1A1A1A]' : 'text-red-600')}>{analysis.score}%</p>
          <div className="w-full bg-[#F0F0F0] rounded-full h-1 mt-3">
            <div className="h-1 rounded-full bg-[#1A1A1A]" style={{ width: `${analysis.score}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions — Notion style */}
        <div className="lg:col-span-2 card card-hover">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0F0F0]">
            <h2 className="text-sm font-medium text-[#1A1A1A]">Últimos movimientos</h2>
            <Link to="/transactions" className="text-xs text-[#707070] hover:text-[#1A1A1A] transition-colors flex items-center gap-0.5">Ver todo <ChevronRight size={12} /></Link>
          </div>
          {loading ? <div className="px-5 py-8 text-center text-[#A0A0A0] text-sm">Cargando...</div>
            : txs.length === 0 ? (
              <div className="empty-state">
                <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center mb-3">
                  <Wallet size={18} className="text-[#A0A0A0]" />
                </div>
                <p className="text-sm text-[#707070] mb-1">Sin movimientos aún</p>
                <p className="text-xs text-[#A0A0A0] mb-4">Empieza registrando tu primer ingreso o gasto</p>
                <button onClick={() => setShowModal(true)} className="btn-primary">Agregar movimiento</button>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0]">
                {txs.slice(0, 8).map(tx => {
                  const cat = getCat(tx.category_id)
                  return (
                    <div key={tx.id} className="table-row group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm" style={{ backgroundColor: cat.color + '12' }}>{cat.icon}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{tx.description}</p>
                          <p className="text-xs text-[#A0A0A0]">{cat.name} · {formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium tabular-nums', tx.type === 'income' ? 'text-emerald-600' : 'text-[#1A1A1A]')}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all">
                          <X size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Expense Breakdown */}
          {expenseBreakdown.length > 0 && (
            <div className="card card-hover">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0F0F0]">
                <h2 className="text-sm font-medium text-[#1A1A1A]">Gastos del mes</h2>
                <Link to="/reports" className="text-xs text-[#707070] hover:text-[#1A1A1A] transition-colors">Ver →</Link>
              </div>
              <div className="p-4 space-y-3">
                {expenseBreakdown.map(cat => {
                  const pct = monthExpense > 0 ? (cat.amount / monthExpense) * 100 : 0
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat.icon}</span>
                          <span className="text-xs font-medium text-[#1A1A1A]">{cat.name}</span>
                        </div>
                        <span className="text-xs font-medium tabular-nums text-[#5C5C5C]">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="w-full bg-[#F0F0F0] rounded-full h-1">
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="card card-hover p-4">
            <h2 className="text-sm font-medium text-[#1A1A1A] mb-3">Accesos rápidos</h2>
            <div className="space-y-1">
              {[
                { label: 'Ver deudas', path: '/debts', icon: '💳' },
                { label: 'Metas de ahorro', path: '/goals', icon: '🎯' },
                { label: 'Calendario', path: '/calendar', icon: '📅' },
              ].map(item => (
                <Link key={item.path} to={item.path} className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-[#5C5C5C] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] transition-colors">
                  <span className="text-sm">{item.icon}</span> {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal — Linear style */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-end lg:items-center justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-lg w-full lg:max-w-md shadow-xl border border-[#EAEAEA]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#EAEAEA]">
                <h3 className="text-sm font-medium text-[#1A1A1A]">Nuevo movimiento</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#F5F5F5] rounded"><X size={14} className="text-[#707070]" /></button>
              </div>
              <div className="p-5 space-y-4">
                {/* Type toggle */}
                <div className="flex gap-1 bg-[#F5F5F5] rounded-md p-0.5">
                  {[{ k: 'expense', l: 'Gasto' }, { k: 'income', l: 'Ingreso' }].map(t => (
                    <button key={t.k} onClick={() => setForm({ ...form, type: t.k, category_id: '' })}
                      className={cn('flex-1 py-1.5 rounded text-xs font-medium transition-all',
                        form.type === t.k ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#707070]')}>{t.l}</button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Descripción</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder={form.type === 'expense' ? 'Ej: Supermercado' : 'Ej: Salario mensual'}
                    className="input" />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Monto</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-sm">$</span>
                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                      placeholder="0.00" className="input pl-7 font-medium" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5C5C5C] mb-2 block">Categoría</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(form.type === 'expense'
                      ? [{ id: 'food', name: 'Comida', icon: '🍔' }, { id: 'transport', name: 'Transporte', icon: '🚗' }, { id: 'home', name: 'Vivienda', icon: '🏠' }, { id: 'fun', name: 'Ocio', icon: '🎮' }, { id: 'health', name: 'Salud', icon: '💊' }, { id: 'super', name: 'Super', icon: '🛒' }, { id: 'gas', name: 'Gasolina', icon: '⛽' }, { id: 'other_expense', name: 'Otros', icon: '📦' }]
                      : [{ id: 'salary', name: 'Salario', icon: '💼' }, { id: 'freelance', name: 'Freelance', icon: '💻' }, { id: 'business', name: 'Negocio', icon: '🏪' }, { id: 'invest', name: 'Inversión', icon: '📈' }, { id: 'other_income', name: 'Otros', icon: '💰' }]
                    ).map(c => (
                      <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })}
                        className={cn('flex flex-col items-center gap-0.5 p-2 rounded-md text-xs transition-all',
                          form.category_id === c.id ? 'bg-[#F0F0F0] text-[#1A1A1A] font-medium' : 'bg-white hover:bg-[#F5F5F5] text-[#5C5C5C]')}>
                        <span className="text-base">{c.icon}</span><span className="text-[10px]">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Fecha</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button onClick={addTx} className="btn-primary flex-1">Guardar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
