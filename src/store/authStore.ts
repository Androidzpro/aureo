import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import type { User, Transaction, Budget, Debt, SavingsGoal } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      login: async (email: string, password: string) => {
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (error || !users) throw new Error('Credenciales inválidas')

        const isValid = await bcrypt.compare(password, users.password)
        if (!isValid) throw new Error('Credenciales inválidas')

        set({
          user: { id: users.id, email: users.email, name: users.name, created_at: users.created_at },
          isAuthenticated: true,
        })
      },

      register: async (name: string, email: string, password: string) => {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single()

        if (existing) throw new Error('Este email ya está registrado')

        const hashedPassword = await bcrypt.hash(password, 10)
        const { data, error } = await supabase
          .from('users')
          .insert([{ email, name, password: hashedPassword }])
          .select()
          .single()

        if (error) throw new Error(error.message)

        set({
          user: { id: data.id, email: data.email, name: data.name, created_at: data.created_at },
          isAuthenticated: true,
        })
      },
    }),
    { name: 'flowfin-auth' }
  )
)
