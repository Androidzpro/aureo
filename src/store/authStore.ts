import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/data'
import bcrypt from 'bcryptjs'

interface Profile { id: string; email: string; full_name: string; created_at: string }

interface AuthState {
  profile: Profile | null
  isAuthenticated: boolean
  setProfile: (p: Profile | null) => void
  logout: () => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      isAuthenticated: false,
      setProfile: (p) => set({ profile: p, isAuthenticated: !!p }),
      logout: () => set({ profile: null, isAuthenticated: false }),

      login: async (email, password) => {
        const { data: users, error } = await supabase.from('profiles').select('*').eq('email', email).single()
        if (error || !users) throw new Error('Credenciales inválidas')
        // Check password stored in custom auth or legacy users table
        const { data: legacyUser } = await supabase.from('users').select('*').eq('email', email).single()
        if (legacyUser) {
          const isValid = await bcrypt.compare(password, legacyUser.password)
          if (!isValid) throw new Error('Credenciales inválidas')
          set({ profile: { id: legacyUser.id, email: legacyUser.email, full_name: legacyUser.name, created_at: legacyUser.created_at }, isAuthenticated: true })
          return
        }
        throw new Error('Credenciales inválidas')
      },

      register: async (name, email, password) => {
        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single()
        if (existing) throw new Error('Este email ya está registrado')
        const hashed = await bcrypt.hash(password, 10)
        const { data, error } = await supabase.from('users').insert([{ email, name, password: hashed }]).select().single()
        if (error) throw new Error(error.message)
        set({ profile: { id: data.id, email: data.email, full_name: data.name, created_at: data.created_at }, isAuthenticated: true })
      },
    }),
    { name: 'flowfin-auth-v3' }
  )
)
