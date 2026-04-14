import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, cn } from '@/lib/data'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Transaction } from '@/types'

export default function AnalyticsPage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [profile?.id])

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false })
    if (data) setTxs(data)
    setLoading(false)
  }

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {}
    txs.forEach(t => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!map[key]) {
        map[key] = { month: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }), income: 0, expense: 0 }
      }
      if (t.type === 'income') map[key].income += t.amount
      else map[key].expense += t.amount
    })
    return Object.values(map).slice(-6)
  }, [txs])

  const catData = useMemo(() => {
    const map: Record<string, number> = {}
    txs.filter(t => t.type === 'expense').forEach(t => {
      const c = getCat(t.category_id ?? undefined)
      map[c.name] = (map[c.name] || 0) + t.amount
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value, color: getCat(undefined).color }))
  }, [txs])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-500 rounded-full animate-spin" /></div>

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Reportes</h1>
        <p className="text-xs text-gray-400">Análisis de tus finanzas</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1"><TrendingUp size={14} className="text-emerald-500" /><p className="text-[10px] font-medium text-gray-400">Ingresos</p></div>
          <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalIncome, profile?.currency)}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1"><TrendingDown size={14} className="text-red-500" /><p className="text-[10px] font-medium text-gray-400">Gastos</p></div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpense, profile?.currency)}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1"><BarChart3 size={14} className="text-indigo-500" /><p className="text-[10px] font-medium text-gray-400">Balance</p></div>
          <p className={cn('text-sm font-bold', balance >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(balance, profile?.currency)}</p>
        </div>
      </div>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Ingresos vs Gastos</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value, profile?.currency)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="income" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category breakdown */}
      {catData.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Gastos por categoría</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={catData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {catData.map((entry, i) => <Cell key={i} fill={getCat(undefined).color} />)}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value, profile?.currency)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {catData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCat(undefined).color }} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatCurrency(cat.value, profile?.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
