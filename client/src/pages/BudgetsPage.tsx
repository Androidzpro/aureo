import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function BudgetsPage() {
  // Mock data
  const budgets = [
    { id: 1, category: 'Food', spent: 450, limit: 600, color: 'bg-blue-500' },
    { id: 2, category: 'Entertainment', spent: 85, limit: 150, color: 'bg-purple-500' },
    { id: 3, category: 'Transport', spent: 120, limit: 200, color: 'bg-green-500' },
    { id: 4, category: 'Shopping', spent: 280, limit: 300, color: 'bg-orange-500' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Budgets</h1>
          <p className="text-muted-foreground">Manage your spending limits</p>
        </div>
        <Button>
          <Plus size={16} className="mr-2" />
          New Budget
        </Button>
      </div>

      {/* Summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
              <p className="text-3xl font-bold">{formatCurrency(1250)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Spent</p>
              <p className="text-3xl font-bold text-aureo">{formatCurrency(935)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget List */}
      <div className="space-y-4">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100
          const isOverBudget = percentage >= 100

          return (
            <Card key={budget.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${budget.color}`} />
                    <CardTitle className="text-lg">{budget.category}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-accent rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOverBudget ? 'bg-destructive' : budget.color
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {percentage.toFixed(0)}% used • {formatCurrency(budget.limit - budget.spent)} remaining
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </motion.div>
  )
}
