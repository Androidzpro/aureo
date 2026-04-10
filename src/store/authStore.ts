import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
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

        if (error || !users) {
          throw new Error('Invalid credentials')
        }

        const isValid = await bcrypt.compare(password, users.password)
        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        set({
          user: { id: users.id, email: users.email, name: users.name },
          isAuthenticated: true,
        })
      },

      register: async (name: string, email: string, password: string) => {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single()

        if (existing) {
          throw new Error('User already exists')
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const { data, error } = await supabase
          .from('users')
          .insert([{ email, name, password: hashedPassword }])
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        set({
          user: { id: data.id, email: data.email, name: data.name },
          isAuthenticated: true,
        })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
