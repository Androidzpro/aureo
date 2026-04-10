import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/data'
import bcrypt from 'bcryptjs'

interface User { id: string; email: string; name: string; created_at: string }

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (u: User | null) => void
  logout: () => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (u) => set({ user: u, isAuthenticated: !!u }),
      logout: () => set({ user: null, isAuthenticated: false }),
      login: async (email, password) => {
        const { data: users, error } = await supabase.from('users').select('*').eq('email', email).single()
        if (error || !users) throw new Error('Credenciales inválidas')
        const isValid = await bcrypt.compare(password, users.password)
        if (!isValid) throw new Error('Credenciales inválidas')
        set({ user: { id: users.id, email: users.email, name: users.name, created_at: users.created_at }, isAuthenticated: true })
      },
      register: async (name, email, password) => {
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single()
        if (existing) throw new Error('Este email ya está registrado')
        const hashed = await bcrypt.hash(password, 10)
        const { data, error } = await supabase.from('users').insert([{ email, name, password: hashed }]).select().single()
        if (error) throw new Error(error.message)
        set({ user: { id: data.id, email: data.email, name: data.name, created_at: data.created_at }, isAuthenticated: true })
      },
    }),
    { name: 'flowfin-auth' }
  )
)
