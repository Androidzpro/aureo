import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ReportsPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [totals, setTotals] = useState({ income: 0, expenses: 0 })

  useEffect(() => { loadData() }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    const { data: txs } = await supabase.from('transactions').select('*, categories(*)').eq('user_id', user.id).order('date', { ascending: false })
    if (txs) {
      const expenses = txs.filter(t => t.type === 'expense')
      const income = txs.filter(t => t.type === 'income')
      setTotals({
        income: income.reduce((s, t) => s + t.amount, 0),
        expenses: expenses.reduce((s, t) => s + t.amount, 0),
      })

      // By category
      const catMap: Record<string, number> = {}
      expenses.forEach(t => {
        const name = t.categories?.name || t.category || 'Otros'
        catMap[name] = (catMap[name] || 0) + t.amount
      })
      const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#3B82F6', '#6366F1', '#64748B']
      setCategoryData(Object.entries(catMap).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] })))

      // By month
      const monthMap: Record<string, { income: number; expense: number }> = {}
      txs.forEach(t => {
        const d = new Date(t.date)
        const key = d.toLocaleDateString('es-MX', { month: 'short' })
        if (!monthMap[key]) monthMap[key] = { month: key, income: 0, expense: 0 }
        if (t.type === 'income') monthMap[key].income += t.amount
        else monthMap[key].expense += t.amount
      })
      setMonthlyData(Object.values(monthMap))
    }
    setLoading(false)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando...</div>

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Visualiza tus finanzas con gráficos</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-400 mb-1">Total ingresado</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.income)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-400 mb-1">Total gastado</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.expenses)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Gastos por categoría</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, pct }) => `${name} ${(pct * 100).toFixed(0)}%`}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-8">Sin datos</p>}
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Ingresos vs Gastos</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Ingresos" />
                <Bar dataKey="expense" fill="#EF4444" name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-8">Sin datos</p>}
        </div>
      </div>
    </motion.div>
  )
}
