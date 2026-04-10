import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight, ArrowDownRight,
  Target, CreditCard, PiggyBank, Calendar, Search, Filter, Download,
  ChevronDown, MoreHorizontal, Edit2, Trash2, X, Check, AlertTriangle,
  ArrowRightLeft, BarChart3, Eye, EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, formatShortDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function HomePage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ balance: 0, income: 0, expenses: 0, savings: 0, debts: 0, netWorth: 0 })
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showTxModal, setShowTxModal] = useState(false)
  const [txForm, setTxForm] = useState({ description: '', amount: '', type: 'expense', category_id: '', account_id: '', date: new Date().toISOString().split('T')[0], is_recurring: false, notes: '' })
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => { loadData() }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Load all data in parallel
      const [txsRes, accountsRes, budgetsRes, goalsRes, catsRes, debtsRes] = await Promise.all([
        supabase.from('transactions').select('*, categories(*), accounts(*)').eq('user_id', user.id).gte('date', startOfMonth).order('date', { ascending: false }).limit(50),
        supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('budgets').select('*, categories(*)').eq('user_id', user.id).eq('month', now.getMonth() + 1).eq('year', now.getFullYear()),
        supabase.from('savings_goals').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('categories').select('*').eq('type', 'expense'),
        supabase.from('debts').select('*').eq('user_id', user.id).eq('status', 'active'),
      ])

      const txs = txsRes.data || []
      const accs = accountsRes.data || []
      const bgs = budgetsRes.data || []
      const gls = goalsRes.data || []
      const cats = catsRes.data || []
      const dbts = debtsRes.data || []

      setTransactions(txs)
      setAccounts(accs)
      setBudgets(bgs)
      setGoals(gls)
      setCategories(cats)

      const income = txs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
      const expenses = txs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
      const totalAccounts = accs.filter((a: any) => a.type !== 'credit').reduce((s: number, a: any) => s + (a.balance || 0), 0)
      const totalDebts = dbts.reduce((s: number, d: any) => s + (d.total_amount - d.paid_amount), 0)
      const totalGoals = gls.reduce((s: number, g: any) => s + g.current_amount, 0)

      setStats({
        balance: totalAccounts,
        income,
        expenses,
        savings: totalGoals,
        debts: totalDebts,
        netWorth: totalAccounts - totalDebts,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || tx.categories?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchType = filterType === 'all' || tx.type === filterType
      return matchSearch && matchType
    })
  }, [transactions, searchQuery, filterType])

  const addTransaction = async () => {
    if (!user?.id || !txForm.amount || !txForm.description) return
    const amount = parseFloat(txForm.amount)
    await supabase.from('transactions').insert([{
      user_id: user.id,
      type: txForm.type,
      amount,
      description: txForm.description,
      category_id: txForm.category_id || null,
      account_id: txForm.account_id || null,
      date: new Date(txForm.date).toISOString(),
      is_recurring: txForm.is_recurring,
      notes: txForm.notes || null,
    }])
    // Update account balance
    if (txForm.account_id) {
      const acc = accounts.find(a => a.id === txForm.account_id)
      if (acc) {
        const newBalance = txForm.type === 'income' ? acc.balance + amount : acc.balance - amount
        await supabase.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', txForm.account_id)
      }
    }
    setShowTxModal(false)
    setTxForm({ description: '', amount: '', type: 'expense', category_id: '', account_id: '', date: new Date().toISOString().split('T')[0], is_recurring: false, notes: '' })
    loadData()
  }

  const deleteTransaction = async (id: string, accountId?: string, type?: string, amount?: number) => {
    await supabase.from('transactions').delete().eq('id', id)
    if (accountId && type && amount) {
      const acc = accounts.find(a => a.id === accountId)
      if (acc) {
        const newBalance = type === 'income' ? acc.balance - amount : acc.balance + amount
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', accountId)
      }
    }
    loadData()
  }

  const exportCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Tipo', 'Categoría', 'Monto', 'Notas']
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString('es-MX'),
      t.description,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.categories?.name || 'Sin categoría',
      t.amount.toFixed(2),
      t.notes || ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flowfin_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const financialHealth = useMemo(() => {
    const savingsRate = stats.income > 0 ? ((stats.income - stats.expenses) / stats.income) * 100 : 0
    const debtRatio = stats.balance > 0 ? (stats.debts / stats.balance) * 100 : 100
    let score = 50
    if (savingsRate > 20) score += 20
    else if (savingsRate > 10) score += 10
    if (debtRatio < 30) score += 15
    else if (debtRatio < 60) score += 5
    if (stats.income > stats.expenses) score += 15
    return Math.min(Math.max(score, 0), 100)
  }, [stats])

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Hola, {user?.name?.split(' ')[0] || 'Usuario'} 👋
            </h1>
            <p className="text-gray-500 mt-1">Resumen financiero de {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="border-gray-200">
              <Download size={14} className="mr-1.5" /> Exportar
            </Button>
            <Button onClick={() => setShowTxModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-200">
              <Plus size={16} className="mr-1.5" /> Nuevo
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Financial Health Score */}
      <motion.div variants={item} className="mb-6">
        <div className={cn(
          'rounded-2xl p-5 text-white shadow-lg',
          financialHealth >= 70 ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
          financialHealth >= 40 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
          'bg-gradient-to-r from-red-500 to-rose-600'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Salud financiera</p>
              <p className="text-4xl font-bold">{financialHealth}%</p>
              <p className="text-white/70 text-xs mt-1">
                {financialHealth >= 70 ? '🎉 ¡Excelente! Vas muy bien' :
                 financialHealth >= 40 ? '⚡ Bien, pero puedes mejorar' :
                 '⚠️ Necesitas atención urgente'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">Ahorro: {stats.income > 0 ? (((stats.income - stats.expenses) / stats.income) * 100).toFixed(0) : 0}%</p>
              <p className="text-white/70 text-xs">Deuda: {formatCurrency(stats.debts)}</p>
              <p className="text-white/70 text-xs">Patrimonio: {formatCurrency(stats.netWorth)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard title="Patrimonio" value={formatCurrency(stats.netWorth)} icon={Wallet} color="from-indigo-500 to-purple-600" bgColor="bg-indigo-50" textColor="text-indigo-600" />
        <StatCard title="Ingresos del mes" value={formatCurrency(stats.income)} icon={ArrowUpRight} color="from-emerald-500 to-green-600" bgColor="bg-emerald-50" textColor="text-emerald-600" />
        <StatCard title="Gastos del mes" value={formatCurrency(stats.expenses)} icon={ArrowDownRight} color="from-red-500 to-rose-600" bgColor="bg-red-50" textColor="text-red-600" />
        <StatCard title="Ahorro" value={formatCurrency(stats.savings)} icon={PiggyBank} color="from-amber-500 to-orange-600" bgColor="bg-amber-50" textColor="text-amber-600" />
      </motion.div>

      {/* Accounts Summary */}
      {accounts.length > 0 && (
        <motion.div variants={item} className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Mis cuentas</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: acc.color + '20' }}>
                    <Wallet size={14} style={{ color: acc.color }} />
                  </div>
                  <span className="text-xs text-gray-500 truncate">{acc.name}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(acc.balance || 0)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Transactions */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Movimientos recientes</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Filter size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar movimiento..." className="pl-9" />
                </div>
                <div className="flex gap-2">
                  {[
                    { key: 'all', label: 'Todos' },
                    { key: 'income', label: 'Ingresos' },
                    { key: 'expense', label: 'Gastos' },
                  ].map(f => (
                    <button key={f.key} onClick={() => setFilterType(f.key)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        filterType === f.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 mb-2">{searchQuery ? 'No se encontraron resultados' : 'No hay movimientos este mes'}</p>
              {!searchQuery && (
                <Button onClick={() => setShowTxModal(true)} variant="outline" size="sm">
                  Agrega tu primer movimiento →
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      tx.type === 'income' ? 'bg-emerald-50' : tx.type === 'transfer' ? 'bg-blue-50' : 'bg-red-50'
                    )}>
                      {tx.type === 'income' ? <ArrowUpRight size={18} className="text-emerald-600" /> :
                       tx.type === 'transfer' ? <ArrowRightLeft size={18} className="text-blue-600" /> :
                       <ArrowDownRight size={18} className="text-red-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400">
                        {tx.categories?.name || tx.category}
                        {tx.is_recurring && <span className="ml-1 text-indigo-500">🔄 Recurrente</span>}
                        {tx.accounts && <span className="ml-1">• {tx.accounts.name}</span>}
                        {' • '}{formatShortDate(tx.date)}
                      </p>
                      {tx.notes && <p className="text-xs text-gray-400 truncate mt-0.5">{tx.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'font-semibold text-sm',
                      tx.type === 'income' ? 'text-emerald-600' : tx.type === 'transfer' ? 'text-blue-600' : 'text-red-600'
                    )}>
                      {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </span>
                    <button onClick={() => deleteTransaction(tx.id, tx.account_id, tx.type, tx.amount)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nuevo movimiento</h3>
              <button onClick={() => setShowTxModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                {[
                  { key: 'expense', label: 'Gasto', color: 'red' },
                  { key: 'income', label: 'Ingreso', color: 'emerald' },
                  { key: 'transfer', label: 'Transferencia', color: 'blue' },
                ].map(t => (
                  <button key={t.key} onClick={() => setTxForm({ ...txForm, type: t.key })}
                    className={cn('flex-1 py-2 rounded-lg font-medium text-sm transition-all',
                      txForm.type === t.key
                        ? t.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300' :
                          t.color === 'blue' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' :
                          'bg-red-100 text-red-700 ring-2 ring-red-300'
                        : 'bg-gray-100 text-gray-500'
                    )}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div>
                <Label>Descripción</Label>
                <Input value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} placeholder="Ej: Salario mensual, Supermercado..." />
              </div>
              <div>
                <Label>Monto ($)</Label>
                <Input type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoría</Label>
                  <select value={txForm.category_id} onChange={(e) => setTxForm({ ...txForm, category_id: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Cuenta</Label>
                  <select value={txForm.account_id} onChange={(e) => setTxForm({ ...txForm, account_id: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Sin cuenta</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
              </div>
              <div>
                <Label>Notas (opcional)</Label>
                <Input value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} placeholder="Detalles adicionales..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={txForm.is_recurring} onChange={(e) => setTxForm({ ...txForm, is_recurring: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-600">🔄 Transacción recurrente</span>
              </label>
              <Button onClick={addTransaction} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                Guardar movimiento
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

function StatCard({ title, value, icon: Icon, bgColor, textColor }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{title}</span>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bgColor)}>
          <Icon size={16} className={textColor} />
        </div>
      </div>
      <p className="text-xl lg:text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
