import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { useAuthStore, loadSession } from '@/store/authStore'
import AppLayout from '@/components/AppLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import OnboardingPage from '@/pages/OnboardingPage'
import HomePage from '@/pages/HomePage'
import TransactionsPage from '@/pages/TransactionsPage'
import CalendarPage from '@/pages/CalendarPage'
import DebtsPage from '@/pages/DebtsPage'
import GoalsPage from '@/pages/GoalsPage'
import BudgetsPage from '@/pages/BudgetsPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore(s => s.isLoading)
  const auth = useAuthStore(s => s.isAuthenticated)
  const onboarded = useAuthStore(s => s.profile?.onboarded)

  if (isLoading) return <LoadingScreen />
  if (!auth) return <Navigate to="/login" replace />
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    loadSession().finally(() => setInitialized(true))
  }, [])

  if (!initialized) return <LoadingScreen />

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="debts" element={<DebtsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
