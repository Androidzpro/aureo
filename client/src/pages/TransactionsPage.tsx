import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function TransactionsPage() {
  // Mock data
  const transactions = [
    { id: 1, description: 'Salary', amount: 3200, type: 'income', date: '2026-04-10', category: 'Income' },
    { id: 2, description: 'Groceries', amount: -85.50, type: 'expense', date: '2026-04-09', category: 'Food' },
    { id: 3, description: 'Netflix', amount: -15.99, type: 'expense', date: '2026-04-08', category: 'Entertainment' },
    { id: 4, description: 'Gym Membership', amount: -50, type: 'expense', date: '2026-04-07', category: 'Health' },
    { id: 5, description: 'Freelance Work', amount: 500, type: 'income', date: '2026-04-06', category: 'Income' },
    { id: 6, description: 'Restaurant', amount: -45.20, type: 'expense', date: '2026-04-05', category: 'Food' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus size={16} className="mr-2" />
            Add
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:border-aureo/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category} • {formatDate(transaction.date)}
                  </p>
                </div>
                <p
                  className={cn(
                    'font-semibold text-lg',
                    transaction.type === 'income' ? 'text-success' : 'text-destructive'
                  )}
                >
                  {transaction.type === 'income' ? '+' : '-'}$
                  {Math.abs(transaction.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
