import React, { createContext, useContext, ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import type { User, AuthResponse } from '@/types'

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setToken, logout: logoutStore } = useAuthStore()

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    })
    setUser(data.user)
    setToken(data.token)
  }

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    })
    setUser(data.user)
    setToken(data.token)
  }

  const logout = () => {
    logoutStore()
  }

  return (
    <AuthContext.Provider value={{ login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
