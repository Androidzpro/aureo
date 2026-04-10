import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase, getCat, formatCurrency, CATEGORIES, analyzeFinances } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, CartesianGrid } from 'recharts'
import { Download, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/data'

export default function ReportsPage() {
  const { user } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (!user?.id) return
    supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).then(({ data }) => {
      if (data) setTxs(data)
      setLoading(false)
    })
  }, [user?.id])

  const analysis = useMemo(() => analyzeFinances(txs), [txs])

  const monthlyData = useMemo(() => {
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const now = new Date(); const data = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth(), y = d.getFullYear()
      const mTxs = txs.filter(t => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y })
      data.push({ month: months[m], income: mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) })
    }
    return data
  }, [txs])

  const catData = useMemo(() => {
    const map: Record<string, number> = {}
    txs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); map[c.name] = (map[c.name] || 0) + t.amount })
    const colors = ['#EF4444','#F59E0B','#8B5CF6','#EC4899','#10B981','#3B82F6','#6366F1','#64748B','#A855F7','#F97316']
    return Object.entries(map).sort((a,b) => b[1] - a[1]).slice(0, 8).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
  }, [txs])

  const exportCSV = () => {
    const rows = txs.map(t => [new Date(t.date).toLocaleDateString('es-MX'), t.description, t.type === 'income' ? 'Ingreso' : 'Gasto', getCat(t.category_id).name, t.amount].join(','))
    const blob = new Blob(['\ufeffFecha,Descripción,Tipo,Categoría,Monto\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `flowfin_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  if (loading) return <div className="text-center py-12 text-gray-300">Cargando...</div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-extrabold text-gray-900">Reportes</h1><p className="text-gray-400 text-sm">Análisis de tus finanzas</p></div>
        <Button onClick={exportCSV} variant="outline" size="sm" className="border-gray-200"><Download size={14} className="mr-1" /> CSV</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {[{ k: 'overview', l: 'General' }, { k: 'trends', l: 'Tendencias' }, { k: 'categories', l: 'Categorías' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all', tab === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>{t.l}</button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><p className="text-[10px] text-gray-400 uppercase font-semibold">Ingresos</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(analysis.savingsRate >= 0 ? txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0) : 0)}</p></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><p className="text-[10px] text-gray-400 uppercase font-semibold">Gastos</p><p className="text-lg font-bold text-red-600">{formatCurrency(txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0))}</p></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><p className="text-[10px] text-gray-400 uppercase font-semibold">Ahorro</p><p className="text-lg font-bold text-indigo-600">{analysis.savingsRate.toFixed(1)}%</p></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><p className="text-[10px] text-gray-400 uppercase font-semibold">Score</p><p className={cn('text-lg font-bold', analysis.score >= 60 ? 'text-emerald-600' : 'text-red-600')}>{analysis.score}%</p></div>
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Ingresos vs Gastos (6 meses)</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} /><Legend />
                <Bar dataKey="income" fill="#10B981" name="Ingresos" radius={[6,6,0,0]} />
                <Bar dataKey="expense" fill="#EF4444" name="Gastos" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-12">Sin datos</p>}
        </div>
      )}

      {tab === 'trends' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Evolución financiera</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="income" stroke="#10B981" fill="#10B98120" strokeWidth={2} name="Ingresos" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" fill="#EF444420" strokeWidth={2} name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-12">Sin datos</p>}
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Gastos por categoría</h3>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart><Pie data={catData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, pct }) => `${name} ${(pct*100).toFixed(0)}%`} labelLine={false}>
                  {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie><Tooltip formatter={(v: number) => formatCurrency(v)} /></PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-12">Sin gastos</p>}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Ranking</h3>
            {catData.length > 0 ? (
              <div className="space-y-3">
                {catData.map((cat, i) => {
                  const total = catData.reduce((s, c) => s + c.value, 0)
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between mb-1"><span className="text-sm font-medium text-gray-700">{cat.name}</span><span className="text-sm font-bold">{formatCurrency(cat.value)}</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${(cat.value/total)*100}%`, backgroundColor: cat.color }} /></div>
                    </div>
                  )
                })}
              </div>
            ) : <p className="text-center text-gray-400 py-12">Sin datos</p>}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3"><Lightbulb size={18} className="text-amber-600" /><h3 className="font-bold text-amber-800">Tips financieros</h3></div>
        <div className="space-y-2">
          {analysis.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 bg-white/60 rounded-xl p-3">
              <span className="text-lg">{tip.icon}</span>
              <div><p className="text-sm font-semibold text-amber-800">{tip.title}</p><p className="text-xs text-amber-600">{tip.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
