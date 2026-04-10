import { createContext, useContext, ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'

const AuthContext = createContext<ReturnType<typeof useAuthStore> | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}
