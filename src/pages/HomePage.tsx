import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Target,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ balance: 0, income: 0, expenses: 0, savings: 0 })
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const { data: txs } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .order('date', { ascending: false })
        .limit(20)

      if (txs) {
        setTransactions(txs)
        const income = txs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
        const expenses = txs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
        setStats({ balance: income - expenses, income, expenses, savings: 0 })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
          Hola, {user?.name?.split(' ')[0] || 'Usuario'} 👋
        </h1>
        <p className="text-gray-500">Aquí tienes un resumen de tus finanzas este mes</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <StatCard
          title="Balance"
          value={formatCurrency(stats.balance)}
          icon={Wallet}
          color="from-indigo-500 to-purple-600"
          bgColor="bg-indigo-50"
          textColor="text-indigo-600"
        />
        <StatCard
          title="Ingresos"
          value={formatCurrency(stats.income)}
          icon={ArrowUpRight}
          color="from-emerald-500 to-green-600"
          bgColor="bg-emerald-50"
          textColor="text-emerald-600"
        />
        <StatCard
          title="Gastos"
          value={formatCurrency(stats.expenses)}
          icon={ArrowDownRight}
          color="from-red-500 to-rose-600"
          bgColor="bg-red-50"
          textColor="text-red-600"
        />
        <StatCard
          title="Ahorro"
          value={formatCurrency(stats.savings)}
          icon={Target}
          color="from-amber-500 to-orange-600"
          bgColor="bg-amber-50"
          textColor="text-amber-600"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all"
        >
          <Plus size={18} />
          Nuevo movimiento
        </Link>
        <Link
          to="/budgets"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-xl font-medium text-sm border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
        >
          <Wallet size={18} />
          Ver presupuestos
        </Link>
        <Link
          to="/debts"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-xl font-medium text-sm border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all"
        >
          <CreditCard size={18} />
          Mis deudas
        </Link>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Últimos movimientos</h2>
          <Link to="/transactions" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Ver todos →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 mb-2">No hay movimientos este mes</p>
              <Link
                to="/transactions"
                className="text-indigo-600 font-medium text-sm hover:text-indigo-700"
              >
                Agrega tu primer movimiento →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
                    )}>
                      {tx.type === 'income' ? (
                        <ArrowUpRight size={18} className="text-emerald-600" />
                      ) : (
                        <ArrowDownRight size={18} className="text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{tx.description || 'Sin descripción'}</p>
                      <p className="text-xs text-gray-400">
                        {tx.categories?.name || tx.category} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'font-semibold text-sm',
                    tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatCard({ title, value, icon: Icon, color, bgColor, textColor }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</span>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bgColor)}>
          <Icon size={16} className={textColor} />
        </div>
      </div>
      <p className="text-xl lg:text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
