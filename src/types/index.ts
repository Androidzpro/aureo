export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  userId: string
  category: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: 'income' | 'expense'
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}
