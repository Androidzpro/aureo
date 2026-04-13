import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCat, formatCurrency, calcScore, cn } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts'
import { Download } from 'lucide-react'

export default function ReportsPage() {
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false }).then(({ data }) => { if (data) setTxs(data); setLoading(false) })
  }, [profile?.id])

  const score = calcScore(txs)
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0

  const monthlyData = useMemo(() => {
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const now = new Date(); const data = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mTxs = txs.filter(t => { const td = new Date(t.date); return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() })
      data.push({ month: months[d.getMonth()], income: mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) })
    }
    return data
  }, [txs])

  const catData = useMemo(() => {
    const map: Record<string, number> = {}
    txs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); map[c.name] = (map[c.name] || 0) + t.amount })
    const colors = ['#EF4444','#F59E0B','#8B5CF6','#EC4899','#10B981','#3B82F6','#6366F1','#64748B']
    return Object.entries(map).sort((a,b) => b[1] - a[1]).slice(0, 8).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
  }, [txs])

  const exportCSV = () => {
    // FIX: properly escape CSV fields
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`
    const rows = txs.map(t => [
      new Date(t.date).toLocaleDateString('es-MX'),
      escape(t.description),
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      getCat(t.category_id).name,
      t.amount.toFixed(2)
    ].join(','))
    const blob = new Blob(['\ufeffFecha,Descripcion,Tipo,Categoria,Monto\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `flowfin_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  if (loading) return <div className="text-center py-12 text-gray-300 text-xs">Cargando...</div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Reportes</h1><p className="text-xs text-gray-400">Análisis de tus finanzas</p></div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300"><Download size={13} /> CSV</button>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[{ k: 'overview', l: 'General' }, { k: 'trends', l: 'Tendencias' }, { k: 'categories', l: 'Categorías' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all', tab === t.k ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400')}>{t.l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] text-gray-400 uppercase">Ingresos</p><p className="text-base font-bold text-emerald-600">{formatCurrency(income, profile?.currency)}</p></div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] text-gray-400 uppercase">Gastos</p><p className="text-base font-bold text-red-600">{formatCurrency(expense, profile?.currency)}</p></div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] text-gray-400 uppercase">Ahorro</p><p className="text-base font-bold text-gray-900 dark:text-white">{savingsRate.toFixed(1)}%</p></div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"><p className="text-[10px] text-gray-400 uppercase">Score</p><p className={cn('text-base font-bold', score >= 60 ? 'text-gray-900 dark:text-white' : 'text-red-600')}>{score}%</p></div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        {tab === 'overview' && (
          <>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Ingresos vs Gastos</h3>
            {monthlyData.some(m => m.income > 0 || m.expense > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" /><XAxis dataKey="month" fontSize={11} /><YAxis fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(v: number) => formatCurrency(v, profile?.currency)} /><Legend />
                  <Bar dataKey="income" fill="#10B981" name="Ingresos" radius={[4,4,0,0]} /><Bar dataKey="expense" fill="#EF4444" name="Gastos" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-8 text-xs">Sin datos suficientes</p>}
          </>
        )}
        {tab === 'trends' && (
          <>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Evolución</h3>
            {monthlyData.some(m => m.income > 0 || m.expense > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" /><XAxis dataKey="month" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v: number) => formatCurrency(v, profile?.currency)} />
                  <Area type="monotone" dataKey="income" stroke="#10B981" fill="#10B98115" strokeWidth={2} name="Ingresos" /><Area type="monotone" dataKey="expense" stroke="#EF4444" fill="#EF444415" strokeWidth={2} name="Gastos" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-8 text-xs">Sin datos</p>}
          </>
        )}
        {tab === 'categories' && (
          <>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Gastos por categoría</h3>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie><Tooltip formatter={(v: number) => formatCurrency(v, profile?.currency)} /></PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-8 text-xs">Sin gastos</p>}
          </>
        )}
      </div>
    </motion.div>
  )
}
