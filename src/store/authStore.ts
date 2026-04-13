import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/data'

interface Profile {
  id: string
  name: string
  email: string
  currency: string
  monthly_income: number | null
  income_type: string
  has_debts: boolean
  goal_type: string
  onboarded: boolean
}

interface AuthState {
  profile: Profile | null
  isAuthenticated: boolean
  setProfile: (p: Profile | null) => void
  logout: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  completeOnboarding: (data: { currency: string; monthly_income: number; income_type: string; has_debts: boolean; goal_type: string }) => Promise<void>
  updatePassword: (newPass: string) => Promise<void>
  updateCurrency: (currency: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      isAuthenticated: false,
      setProfile: (p) => set({ profile: p, isAuthenticated: !!p }),

      logout: async () => {
        await supabase.auth.signOut()
        set({ profile: null, isAuthenticated: false })
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Credenciales inválidas' : error.message)
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        if (profile) set({ profile: { ...profile, email }, isAuthenticated: true })
      },

      register: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        if (data.user) {
          await supabase.from('profiles').insert([{ id: data.user.id, name, currency: 'MXN', onboarded: false }])
          set({ profile: { id: data.user.id, name, email, currency: 'MXN', monthly_income: null, income_type: 'fixed', has_debts: false, goal_type: 'save', onboarded: false }, isAuthenticated: true })
        }
      },

      completeOnboarding: async (data) => {
        const profile = useAuthStore.getState().profile
        if (!profile) return
        await supabase.from('profiles').update({ ...data, onboarded: true }).eq('id', profile.id)
        set({ profile: { ...profile, ...data, onboarded: true } })
      },

      updatePassword: async (newPass) => {
        const { error } = await supabase.auth.updateUser({ password: newPass })
        if (error) throw new Error(error.message)
      },

      updateCurrency: async (currency) => {
        const profile = useAuthStore.getState().profile
        if (!profile) return
        await supabase.from('profiles').update({ currency }).eq('id', profile.id)
        set({ profile: { ...profile, currency } })
      },
    }),
    { name: 'flowfin-v5-auth' }
  )
)

// Load session on app start
export async function loadSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (profile) useAuthStore.getState().setProfile({ ...profile, email: session.user.email || '' })
  }
  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (profile) useAuthStore.getState().setProfile({ ...profile, email: session.user.email || '' })
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.getState().setProfile(null)
    }
  })
}
