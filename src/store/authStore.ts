import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/data'
import type { Profile, GoalType, IncomeType } from '@/types'

interface AuthState {
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  setProfile: (p: Profile | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  completeOnboarding: (data: { currency: string; monthly_income: number; income_type: IncomeType; has_debts: boolean; goal_type: GoalType }) => Promise<void>
  updatePassword: (newPass: string) => Promise<void>
  updateCurrency: (currency: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      setProfile: (p) => set({ profile: p, isAuthenticated: !!p }),
      setLoading: (loading) => set({ isLoading: loading }),

      logout: async () => {
        await supabase.auth.signOut()
        set({ profile: null, isAuthenticated: false })
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.')
          }
          if (error.message.includes('Invalid login') || error.message.includes('Invalid credentials')) {
            throw new Error('Credenciales inválidas')
          }
          throw new Error(error.message)
        }
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        if (profile) set({ profile: { ...profile, email }, isAuthenticated: true })
      },

      register: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw new Error(error.message === 'User already registered' ? 'Este email ya está registrado' : error.message)
        
        // If user is created but no session, email confirmation is required
        // Don't auto-login; let the user check their email
        if (!data.session && data.user) {
          // Profile will be created by trigger after email confirmation
          // We don't set isAuthenticated here
          // Navigate to register page with verification message
          return { needsVerification: true }
        }
        
        if (data.session && data.user) {
          await new Promise(resolve => setTimeout(resolve, 500))
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
          if (profile) set({ profile: { ...profile, email }, isAuthenticated: true })
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

let _authListenerInitialized = false

export async function loadSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error.message)
    }
    
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (profile) {
        useAuthStore.getState().setProfile({ ...profile, email: session.user.email || '' })
      }
    }

    if (!_authListenerInitialized) {
      _authListenerInitialized = true
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event)
        
        if (event === 'SIGNED_IN' && session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (profile) {
            useAuthStore.getState().setProfile({ ...profile, email: session.user.email || '' })
          }
        } else if (event === 'SIGNED_OUT') {
          useAuthStore.getState().setProfile(null)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (profile) {
            useAuthStore.getState().setProfile({ ...profile, email: session.user.email || '' })
          }
        } else if (event === 'USER_UPDATED' && session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (profile) {
            useAuthStore.getState().setProfile({ ...profile, email: session.user.email || '' })
          }
        }
      })
    }
  } catch (e) {
    console.error('Failed to load session:', e)
  } finally {
    useAuthStore.getState().setLoading(false)
  }
}
