import api from '@/lib/api'
import type { Transaction, Budget, ApiResponse } from '@/types'

export const transactionService = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<Transaction[]>>('/transactions')
    return data
  },
  
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`)
    return data
  },
  
  create: async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.post<ApiResponse<Transaction>>('/transactions', transaction)
    return data
  },
  
  update: async (id: string, transaction: Partial<Transaction>) => {
    const { data } = await api.put<ApiResponse<Transaction>>(`/transactions/${id}`, transaction)
    return data
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/transactions/${id}`)
    return data
  },
}

export const budgetService = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<Budget[]>>('/budgets')
    return data
  },
  
  create: async (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.post<ApiResponse<Budget>>('/budgets', budget)
    return data
  },
  
  update: async (id: string, budget: Partial<Budget>) => {
    const { data } = await api.put<ApiResponse<Budget>>(`/budgets/${id}`, budget)
    return data
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/budgets/${id}`)
    return data
  },
}
