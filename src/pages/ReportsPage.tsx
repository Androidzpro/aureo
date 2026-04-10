import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area, CartesianGrid } from 'recharts'
import { Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReportsPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { loadData() }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    const [txsRes, accsRes, dbtsRes, glsRes] = await Promise.all([
      supabase.from('transactions').select('*, categories(*)').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('accounts').select('*').eq('user_id', user.id),
      supabase.from('debts').select('*').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('savings_goals').select('*').eq('user_id', user.id).eq('is_active', true),
    ])
    if (txsRes.data) setTransactions(txsRes.data)
    if (accsRes.data) setAccounts(accsRes.data)
    if (dbtsRes.data) setDebts(dbtsRes.data)
    if (glsRes.data) setGoals(glsRes.data)
    setLoading(false)
  }

  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalAccounts = accounts.filter(a => a.type !== 'credit').reduce((s, a) => s + (a.balance || 0), 0)
    const totalDebts = debts.reduce((s, d) => s + (d.total_amount - d.paid_amount), 0)
    const totalGoals = goals.reduce((s, g) => s + g.current_amount, 0)
    const avgMonthlyExpense = transactions.length > 0 ? totalExpenses / Math.max(1, new Set(transactions.map(t => new Date(t.date).getMonth())).size) : 0
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses, netWorth: totalAccounts - totalDebts, totalAccounts, totalDebts, totalGoals, avgMonthlyExpense, savingsRate }
  }, [transactions, accounts, debts, goals])

  const monthlyData = useMemo(() => {
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const now = new Date()
    const data = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      const monthTxs = transactions.filter(t => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y })
      data.push({
        month: months[m],
        income: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        savings: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) - monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return data
  }, [transactions])

  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const name = t.categories?.name || 'Otros'
      catMap[name] = (catMap[name] || 0) + t.amount
    })
    const colors = ['#EF4444','#F59E0B','#8B5CF6','#EC4899','#10B981','#3B82F6','#6366F1','#64748B','#A855F7','#F97316']
    return Object.entries(catMap).sort((a,b) => b[1] - a[1]).slice(0, 8).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
  }, [transactions])

  const exportCSV = () => {
    const headers = ['Fecha','Descripción','Tipo','Categoría','Monto','Notas']
    const rows = transactions.map(t => [new Date(t.date).toLocaleDateString('es-MX'), t.description, t.type==='income'?'Ingreso':'Gasto', t.categories?.name||'', t.amount.toFixed(2), t.notes||''])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `flowfin_reporte_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando...</div>

  const tabs = [
    { key: 'overview', label: 'General' },
    { key: 'trends', label: 'Tendencias' },
    { key: 'categories', label: 'Categorías' },
    { key: 'networth', label: 'Patrimonio' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 text-sm mt-1">Análisis detallado de tus finanzas</p>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm" className="border-gray-200"><Download size={14} className="mr-1.5" /> Exportar CSV</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={16} className="text-indigo-500" /><span className="text-xs text-gray-400">Ingresos totales</span></div>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><ArrowDownRight size={16} className="text-red-500" /><span className="text-xs text-gray-400">Gastos totales</span></div>
          <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className="text-amber-500" /><span className="text-xs text-gray-400">Tasa de ahorro</span></div>
          <p className={cn('text-xl font-bold', stats.savingsRate >= 20 ? 'text-emerald-600' : stats.savingsRate >= 10 ? 'text-amber-600' : 'text-red-600')}>{stats.savingsRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingDown size={16} className="text-purple-500" /><span className="text-xs text-gray-400">Patrimonio neto</span></div>
          <p className={cn('text-xl font-bold', stats.netWorth >= 0 ? 'text-indigo-600' : 'text-red-600')}>{formatCurrency(stats.netWorth)}</p>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Ingresos vs Gastos (6 meses)</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name="Ingresos" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" fill="#EF4444" name="Gastos" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-12">Sin datos suficientes</p>}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Ahorro mensual</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="savings" stroke="#6366F1" fill="#6366F120" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-12">Sin datos</p>}
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Evolución financiera</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot={{r:4}} name="Ingresos" />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} dot={{r:4}} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-12">Agrega movimientos para ver tendencias</p>}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Gastos por categoría</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, pct }) => `${name} ${(pct * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-12">Sin gastos registrados</p>}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Ranking de gastos</h3>
            {categoryData.length > 0 ? (
              <div className="space-y-3">
                {categoryData.map((cat, i) => {
                  const total = categoryData.reduce((s, c) => s + c.value, 0)
                  const pct = (cat.value / total) * 100
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(cat.value)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <p className="text-center text-gray-400 py-12">Sin datos</p>}
          </div>
        </div>
      )}

      {activeTab === 'networth' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-indigo-100 text-sm mb-1">Patrimonio neto</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.netWorth)}</p>
              <p className="text-indigo-200 text-xs mt-2">Activos - Deudas</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-gray-400 text-sm mb-1">Total activos</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalAccounts)}</p>
              <p className="text-gray-400 text-xs mt-2">{accounts.length} cuentas</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-gray-400 text-sm mb-1">Total deudas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDebts)}</p>
              <p className="text-gray-400 text-xs mt-2">{debts.length} deudas activas</p>
            </div>
          </div>
          {accounts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Detalle de activos</h3>
              <div className="space-y-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: acc.color + '20' }}>
                        <span className="text-lg">💰</span>
                      </div>
                      <div><p className="font-medium text-gray-900">{acc.name}</p><p className="text-xs text-gray-400">{acc.type}</p></div>
                    </div>
                    <p className="font-bold text-gray-900">{formatCurrency(acc.balance || 0)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {goals.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Ahorro en metas</h3>
              <div className="space-y-3">
                {goals.map(g => {
                  const pct = (g.current_amount / g.target_amount) * 100
                  return (
                    <div key={g.id} className="p-3 rounded-xl bg-gray-50">
                      <div className="flex justify-between mb-1"><span className="font-medium text-gray-900">{g.name}</span><span className="text-sm text-gray-500">{formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${Math.min(pct,100)}%` }} /></div>
                      <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% completado</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
