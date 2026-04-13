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
  changePassword: (current: string, newPass: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (u) => set({ user: u, isAuthenticated: !!u }),
      logout: () => set({ user: null, isAuthenticated: false }),

      login: async (email, password) => {
        // Try legacy users table
        const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single()
        if (error || !user) throw new Error('Credenciales inválidas')
        const valid = await bcrypt.compare(password, user.password)
        if (!valid) throw new Error('Credenciales inválidas')
        set({ user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at }, isAuthenticated: true })
      },

      register: async (name, email, password) => {
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single()
        if (existing) throw new Error('Email ya registrado')
        const hashed = await bcrypt.hash(password, 10)
        const { data, error } = await supabase.from('users').insert([{ email, name, password: hashed }]).select().single()
        if (error) throw new Error(error.message)
        set({ user: { id: data.id, email: data.email, name: data.name, created_at: data.created_at }, isAuthenticated: true })
      },

      changePassword: async (current, newPass) => {
        const u = get().user
        if (!u) throw new Error('No hay sesión')
        const { data: userData } = await supabase.from('users').select('password').eq('id', u.id).single()
        if (!userData) throw new Error('Usuario no encontrado')
        const valid = await bcrypt.compare(current, userData.password)
        if (!valid) throw new Error('Contraseña actual incorrecta')
        const hashed = await bcrypt.hash(newPass, 10)
        await supabase.from('users').update({ password: hashed }).eq('id', u.id)
      },
    }),
    { name: 'flowfin-v4-auth' }
  )
)
