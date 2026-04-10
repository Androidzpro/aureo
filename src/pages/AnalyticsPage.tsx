import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const monthlyData = [
  { month: 'Jan', income: 3200, expenses: 2100 },
  { month: 'Feb', income: 3200, expenses: 1950 },
  { month: 'Mar', income: 3500, expenses: 2300 },
  { month: 'Apr', income: 3200, expenses: 1850 },
]

const categoryData = [
  { name: 'Food', value: 450, color: '#3B82F6' },
  { name: 'Entertainment', value: 85, color: '#A855F7' },
  { name: 'Transport', value: 120, color: '#22C55E' },
  { name: 'Shopping', value: 280, color: '#F97316' },
  { name: 'Bills', value: 650, color: '#EF4444' },
  { name: 'Other', value: 265, color: '#6B7280' },
]

export default function AnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Visualize your financial trends</p>
      </div>

      {/* Income vs Expenses Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>Last 4 months comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#D4AF37" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Current month breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
            <CardDescription>Spending trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="expenses" fill="#D4AF37" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
