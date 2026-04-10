import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function HomePage() {
  // Mock data - will be replaced with real API calls
  const stats = {
    balance: 5420.50,
    income: 3200.00,
    expenses: 1850.75,
    savings: 1349.25,
  }

  const recentTransactions = [
    { id: 1, description: 'Salary', amount: 3200, type: 'income', date: '2026-04-10', category: 'Income' },
    { id: 2, description: 'Groceries', amount: -85.50, type: 'expense', date: '2026-04-09', category: 'Food' },
    { id: 3, description: 'Netflix', amount: -15.99, type: 'expense', date: '2026-04-08', category: 'Entertainment' },
    { id: 4, description: 'Gym', amount: -50, type: 'expense', date: '2026-04-07', category: 'Health' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-muted-foreground">Here's your financial overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Balance"
          value={formatCurrency(stats.balance)}
          icon={Wallet}
          color="text-aureo"
        />
        <StatCard
          title="Income"
          value={formatCurrency(stats.income)}
          icon={TrendingUp}
          color="text-success"
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(stats.expenses)}
          icon={TrendingDown}
          color="text-destructive"
        />
        <StatCard
          title="Savings"
          value={formatCurrency(stats.savings)}
          icon={Wallet}
          color="text-aureo"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Button asChild>
          <Link to="/transactions">
            <Plus size={18} className="mr-2" />
            Add Transaction
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/budgets">View Budgets</Link>
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category} • {transaction.date}
                  </p>
                </div>
                <p
                  className={cn(
                    'font-semibold',
                    transaction.type === 'income' ? 'text-success' : 'text-destructive'
                  )}
                >
                  {transaction.type === 'income' ? '+' : ''}
                  {formatCurrency(Math.abs(transaction.amount))}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-5 w-5', color)} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

import { cn } from '@/lib/utils'
