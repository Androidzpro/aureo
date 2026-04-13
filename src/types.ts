// ===== FLOWFIN - TypeScript Types =====

export type TransactionType = 'income' | 'expense'
export type IncomeType = 'fixed' | 'variable'
export type GoalType = 'save' | 'debt_control' | 'expense_control'
export type DebtStatus = 'active' | 'paid' | 'cancelled'
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly'

export interface Profile {
  id: string
  name: string
  email: string
  currency: string
  monthly_income: number | null
  income_type: IncomeType
  has_debts: boolean
  goal_type: GoalType
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string
  category_id: string | null
  date: string
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  alert_threshold: number
  created_at: string
}

export interface Debt {
  id: string
  user_id: string
  name: string
  total_amount: number
  paid_amount: number
  interest_rate: number
  creditor: string | null
  min_payment: number | null
  due_date: string | null
  status: DebtStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DebtPayment {
  id: string
  debt_id: string
  user_id: string
  amount: number
  date: string
  notes: string | null
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  emoji: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GoalContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  date: string
  notes: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  emoji: string
  color: string
}
