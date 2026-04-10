import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, Filter, Search, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Trash2, X, Calendar, Download, Edit2, Repeat } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, formatShortDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense', category_id: '', account_id: '', date: new Date().toISOString().split('T')[0], is_recurring: false, notes: '' })

  useEffect(() => { loadAll() }, [user?.id])

  const loadAll = async () => {
    if (!user?.id) return
    const [txsRes, catsRes, accsRes] = await Promise.all([
      supabase.from('transactions').select('*, categories(*), accounts(*)').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('categories').select('*').eq('type', 'expense'),
      supabase.from('accounts').select('*').eq('user_id', user.id),
    ])
    if (txsRes.data) setTransactions(txsRes.data)
    if (catsRes.data) setCategories(catsRes.data)
    if (accsRes.data) setAccounts(accsRes.data)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (search && !tx.description?.toLowerCase().includes(search.toLowerCase()) && !tx.categories?.name?.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false
      if (catFilter && tx.category_id !== catFilter) return false
      if (dateFrom && tx.date < dateFrom) return false
      if (dateTo && tx.date > dateTo + 'T23:59:59') return false
      return true
    })
  }, [transactions, search, typeFilter, catFilter, dateFrom, dateTo])

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expenses, net: income - expenses, count: filtered.length }
  }, [filtered])

  const addTransaction = async () => {
    if (!user?.id || !form.amount || !form.description) return
    const amount = parseFloat(form.amount)
    await supabase.from('transactions').insert([{
      user_id: user.id, type: form.type, amount,
      description: form.description, category_id: form.category_id || null,
      account_id: form.account_id || null, date: new Date(form.date).toISOString(),
      is_recurring: form.is_recurring, notes: form.notes || null,
    }])
    if (form.account_id) {
      const acc = accounts.find(a => a.id === form.account_id)
      if (acc) {
        const newBal = form.type === 'income' ? acc.balance + amount : form.type === 'expense' ? acc.balance - amount : acc.balance
        await supabase.from('accounts').update({ balance: newBal }).eq('id', form.account_id)
      }
    }
    setShowModal(false)
    setForm({ description: '', amount: '', type: 'expense', category_id: '', account_id: '', date: new Date().toISOString().split('T')[0], is_recurring: false, notes: '' })
    loadAll()
  }

  const deleteTransaction = async (id: string, accountId?: string, type?: string, amount?: number) => {
    await supabase.from('transactions').delete().eq('id', id)
    if (accountId && type && amount) {
      const acc = accounts.find(a => a.id === accountId)
      if (acc) {
        const newBal = type === 'income' ? acc.balance - amount : acc.balance + amount
        await supabase.from('accounts').update({ balance: newBal }).eq('id', accountId)
      }
    }
    loadAll()
  }

  const exportCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Tipo', 'Categoría', 'Cuenta', 'Monto', 'Notas']
    const rows = filtered.map(t => [
      new Date(t.date).toLocaleDateString('es-MX'), t.description,
      t.type === 'income' ? 'Ingreso' : t.type === 'transfer' ? 'Transferencia' : 'Gasto',
      t.categories?.name || '', t.accounts?.name || '', t.amount.toFixed(2), t.notes || ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `flowfin_movimientos_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-gray-500 text-sm mt-1">{totals.count} movimientos encontrados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm" className="border-gray-200"><Download size={14} className="mr-1" /> CSV</Button>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600"><Plus size={16} className="mr-1.5" /> Nuevo</Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Ingresos</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(totals.income)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Gastos</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totals.expenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Balance</p>
          <p className={cn('text-lg font-bold', totals.net >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(totals.net)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={cn('p-2.5 rounded-xl border transition-colors', showFilters ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200')}>
          <Filter size={18} className="text-gray-500" />
        </button>
      </div>
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div><Label className="text-xs">Tipo</Label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="all">Todos</option><option value="income">Ingresos</option><option value="expense">Gastos</option><option value="transfer">Transferencias</option>
                </select>
              </div>
              <div><Label className="text-xs">Categoría</Label>
                <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">Todas</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><Label className="text-xs">Desde</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" /></div>
              <div><Label className="text-xs">Hasta</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" /></div>
              <div className="flex items-end">
                <Button onClick={() => { setSearch(''); setTypeFilter('all'); setCatFilter(''); setDateFrom(''); setDateTo('') }} variant="outline" size="sm" className="w-full">Limpiar</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nuevo movimiento</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {[{k:'expense',l:'Gasto',c:'red'},{k:'income',l:'Ingreso',c:'emerald'},{k:'transfer',l:'Transferencia',c:'blue'}].map(t => (
                  <button key={t.k} onClick={() => setForm({...form,type:t.k})}
                    className={cn('flex-1 py-2 rounded-lg font-medium text-sm transition-all', form.type===t.k ? (t.c==='emerald'?'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300':t.c==='blue'?'bg-blue-100 text-blue-700 ring-2 ring-blue-300':'bg-red-100 text-red-700 ring-2 ring-red-300'):'bg-gray-100 text-gray-500')}>
                    {t.l}
                  </button>
                ))}
              </div>
              <div><Label>Descripción</Label><Input value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="Ej: Salario, Supermercado..." /></div>
              <div><Label>Monto ($)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({...form,amount:e.target.value})} placeholder="0.00" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Categoría</Label>
                  <select value={form.category_id} onChange={(e) => setForm({...form,category_id:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Sin categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><Label>Cuenta</Label>
                  <select value={form.account_id} onChange={(e) => setForm({...form,account_id:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Sin cuenta</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => setForm({...form,date:e.target.value})} /></div>
              <div><Label>Notas (opcional)</Label><Input value={form.notes} onChange={(e) => setForm({...form,notes:e.target.value})} placeholder="Detalles..." /></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({...form,is_recurring:e.target.checked})} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-600">🔄 Recurrente</span>
              </label>
              <Button onClick={addTransaction} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">Guardar</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* List */}
      {loading ? <div className="text-center py-12 text-gray-400">Cargando...</div>
        : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400">No hay movimientos</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', tx.type==='income'?'bg-emerald-50':tx.type==='transfer'?'bg-blue-50':'bg-red-50')}>
                      {tx.type==='income'?<ArrowUpRight size={18} className="text-emerald-600"/>:tx.type==='transfer'?<ArrowRightLeft size={18} className="text-blue-600"/>:<ArrowDownRight size={18} className="text-red-600"/>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400">
                        {tx.categories?.name || 'Sin categoría'}
                        {tx.is_recurring && <span className="ml-1 text-indigo-500">🔄</span>}
                        {tx.accounts && <span className="ml-1">• {tx.accounts.name}</span>}
                        {' • '}{formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('font-semibold text-sm', tx.type==='income'?'text-emerald-600':tx.type==='transfer'?'text-blue-600':'text-red-600')}>
                      {tx.type==='income'?'+':tx.type==='transfer'?'':'-'}{formatCurrency(Math.abs(tx.amount))}
                    </span>
                    <button onClick={() => deleteTransaction(tx.id, tx.account_id, tx.type, tx.amount)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </motion.div>
  )
}
