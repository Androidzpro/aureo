// Tipos de FlowFin
export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id?: string
  category_id?: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string
  notes?: string
  date: string
  is_recurring: boolean
  recurrence_type?: string
  category?: Category
  account?: Account
  created_at: string
}

export interface Category {
  id: string
  user_id?: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
  monthly_limit?: number
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: string
  balance: number
  color: string
  icon: string
  is_active: boolean
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  period: string
  month: number
  year: number
  created_at: string
}

export interface Debt {
  id: string
  user_id: string
  name: string
  total_amount: number
  paid_amount: number
  interest_rate: number
  min_payment?: number
  due_date?: string
  creditor?: string
  status: 'active' | 'paid' | 'cancelled'
  notes?: string
  created_at: string
}

export interface DebtPayment {
  id: string
  debt_id: string
  amount: number
  date: string
  notes?: string
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline?: string
  color: string
  icon: string
  is_active: boolean
  created_at: string
}
