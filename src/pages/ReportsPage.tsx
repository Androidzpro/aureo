import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCat, formatCurrency, analyzeFinances, cn } from '@/lib/data'
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

  const analysis = useMemo(() => analyzeFinances(txs), [txs])
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
    const rows = txs.map(t => [new Date(t.date).toLocaleDateString('es-MX'), t.description, t.type === 'income' ? 'Ingreso' : 'Gasto', getCat(t.category_id).name, t.amount].join(','))
    const blob = new Blob(['\ufeffFecha,Descripcion,Tipo,Categoria,Monto\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `flowfin_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  if (loading) return <div className="text-center py-12 text-[#A0A0A0] text-sm">Cargando...</div>

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Reportes</h1><p className="page-subtitle">Análisis de tus finanzas</p></div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-1.5"><Download size={14} /> Exportar</button>
      </div>

      <div className="flex gap-1 bg-[#F5F5F5] rounded-md p-0.5 mb-6 w-fit">
        {[{ k: 'overview', l: 'General' }, { k: 'trends', l: 'Tendencias' }, { k: 'categories', l: 'Categorías' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={cn('px-3 py-1.5 rounded text-xs font-medium transition-all', tab === t.k ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#707070] hover:text-[#1A1A1A]')}>{t.l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi"><p className="kpi-label">Ingresos</p><p className="kpi-value text-emerald-600">{formatCurrency(analysis.income)}</p></div>
        <div className="kpi"><p className="kpi-label">Gastos</p><p className="kpi-value text-red-600">{formatCurrency(analysis.expense)}</p></div>
        <div className="kpi"><p className="kpi-label">Tasa de ahorro</p><p className="kpi-value text-[#1A1A1A]">{analysis.savingsRate.toFixed(1)}%</p></div>
        <div className="kpi"><p className="kpi-label">Score</p><p className={cn('kpi-value', analysis.score >= 60 ? 'text-[#1A1A1A]' : 'text-red-600')}>{analysis.score}%</p></div>
      </div>

      <div className="card p-6">
        {tab === 'overview' && (
          <>
            <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">Ingresos vs Gastos</h3>
            {monthlyData.some(m => m.income > 0 || m.expense > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(v: number) => formatCurrency(v)} /><Legend />
                  <Bar dataKey="income" fill="#10B981" name="Ingresos" radius={[4,4,0,0]} /><Bar dataKey="expense" fill="#EF4444" name="Gastos" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-[#A0A0A0] py-12 text-sm">Sin datos suficientes</p>}
          </>
        )}
        {tab === 'trends' && (
          <>
            <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">Evolución financiera</h3>
            {monthlyData.some(m => m.income > 0 || m.expense > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="income" stroke="#10B981" fill="#10B98115" strokeWidth={2} name="Ingresos" /><Area type="monotone" dataKey="expense" stroke="#EF4444" fill="#EF444415" strokeWidth={2} name="Gastos" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-[#A0A0A0] py-12 text-sm">Sin datos</p>}
          </>
        )}
        {tab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">Gastos por categoría</h3>
              {catData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart><Pie data={catData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, pct }) => `${name} ${(pct*100).toFixed(0)}%`} labelLine={false}>
                    {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie><Tooltip formatter={(v: number) => formatCurrency(v)} /></PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-[#A0A0A0] py-12 text-sm">Sin gastos</p>}
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#1A1A1A] mb-4">Ranking</h3>
              {catData.length > 0 ? (
                <div className="space-y-3">
                  {catData.map(cat => { const total = catData.reduce((s, c) => s + c.value, 0); return (
                    <div key={cat.name}>
                      <div className="flex justify-between mb-1"><span className="text-xs font-medium text-[#1A1A1A]">{cat.name}</span><span className="text-xs font-medium text-[#5C5C5C]">{formatCurrency(cat.value)}</span></div>
                      <div className="w-full bg-[#F0F0F0] rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${(cat.value/total)*100}%`, backgroundColor: cat.color }} /></div>
                    </div>
                  )})}
                </div>
              ) : <p className="text-center text-[#A0A0A0] py-12 text-sm">Sin datos</p>}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
