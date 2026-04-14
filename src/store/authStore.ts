import { create } from 'zustand'
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
  register: (name: string, email: string, password: string) => Promise<{ needsVerification: boolean }>
  completeOnboarding: (data: { currency: string; monthly_income: number; income_type: IncomeType; has_debts: boolean; goal_type: GoalType }) => Promise<void>
  updatePassword: (newPass: string) => Promise<void>
  updateCurrency: (currency: string) => Promise<void>
  resendConfirmationEmail: (email: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  setProfile: (p) => set({ profile: p, isAuthenticated: !!p }),
  setLoading: (loading) => set({ isLoading: loading }),

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error && !error.message.includes('session_not_found')) {
        console.error('Logout error:', error.message)
      }
    } catch (e) {
      // Ignore network errors on logout
    }
    set({ profile: null, isAuthenticated: false })
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      // Map Supabase errors to user-friendly messages
      if (error.status === 400 || error.message?.includes('Invalid login') || error.message?.includes('Invalid credentials')) {
        throw new Error('Correo o contraseña incorrectos')
      }
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email not confirmed')) {
        throw new Error('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.')
      }
      if (error.message?.includes('Too many requests')) {
        throw new Error('Demasiados intentos. Espera un momento e intenta de nuevo.')
      }
      throw new Error('Error al iniciar sesión. Verifica tu conexión e intenta de nuevo.')
    }

    if (!data.user) {
      throw new Error('Error al iniciar sesión. Intenta de nuevo.')
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      throw new Error('Error al cargar tu perfil. Intenta de nuevo.')
    }

    if (!profile) {
      throw new Error('No se encontró tu perfil. Contacta soporte.')
    }

    set({
      profile: { ...profile, email: data.user.email || profile.email },
      isAuthenticated: true,
    })
  },

  register: async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: name,
          name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
        throw new Error('Este email ya está registrado. Intenta iniciar sesión.')
      }
      if (error.message?.includes('Password') || error.message?.includes('password')) {
        throw new Error('La contraseña no cumple los requisitos mínimos.')
      }
      throw new Error(error.message || 'Error al crear la cuenta. Intenta de nuevo.')
    }

    // If user is created but no session, email confirmation is required
    if (data.user && !data.session) {
      return { needsVerification: true }
    }

    // If session exists (email confirmation disabled in Supabase), fetch profile
    if (data.session && data.user) {
      // Small delay to let Supabase trigger create the profile
      await new Promise(resolve => setTimeout(resolve, 800))

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        set({
          profile: { ...profile, email: data.user.email || '' },
          isAuthenticated: true,
        })
      }
    }

    return { needsVerification: false }
  },

  resendConfirmationEmail: async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message?.includes('already confirmed')) {
        throw new Error('Este correo ya fue confirmado. Inicia sesión.')
      }
      throw new Error('Error al reenviar el correo. Intenta de nuevo.')
    }
  },

  completeOnboarding: async (data) => {
    const profile = useAuthStore.getState().profile
    if (!profile) return

    const { error } = await supabase
      .from('profiles')
      .update({ ...data, onboarded: true })
      .eq('id', profile.id)

    if (error) {
      console.error('Onboarding error:', error)
      throw new Error('Error al guardar tu configuración. Intenta de nuevo.')
    }

    set({ profile: { ...profile, ...data, onboarded: true } })
  },

  updatePassword: async (newPass) => {
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) {
      if (error.message?.includes('same') || error.message?.includes('Same')) {
        throw new Error('La nueva contraseña debe ser diferente a la actual.')
      }
      throw new Error(error.message || 'Error al actualizar la contraseña.')
    }
  },

  updateCurrency: async (currency) => {
    const profile = useAuthStore.getState().profile
    if (!profile) return

    const { error } = await supabase
      .from('profiles')
      .update({ currency })
      .eq('id', profile.id)

    if (error) {
      console.error('Currency update error:', error)
      return
    }

    set({ profile: { ...profile, currency } })
  },
}))

// ===== SESSION MANAGEMENT =====
let _authListenerInitialized = false

export async function loadSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Session load error:', error.message)
      useAuthStore.getState().setLoading(false)
      return
    }

    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        useAuthStore.getState().setProfile({
          ...profile,
          email: session.user.email || profile.email || '',
        })
      } else {
        // Session exists but no profile — corrupted state, sign out
        console.warn('No profile found for authenticated user, clearing session')
        await supabase.auth.signOut()
      }
    }

    if (!_authListenerInitialized) {
      _authListenerInitialized = true

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] Event:', event)

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (session) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

              if (profile) {
                useAuthStore.getState().setProfile({
                  ...profile,
                  email: session.user.email || profile.email || '',
                })
              }
            }
            break

          case 'SIGNED_OUT':
            useAuthStore.getState().setProfile(null)
            break

          case 'PASSWORD_RECOVERY':
            // User clicked recovery link — session is set, redirect handled by route
            break
        }
      })
    }
  } catch (e: any) {
    console.error('Failed to load session:', e)
  } finally {
    useAuthStore.getState().setLoading(false)
  }
}
