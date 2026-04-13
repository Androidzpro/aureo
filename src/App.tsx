import { useEffect } from 'react'
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuthStore(s => s.isAuthenticated)
  const onboarded = useAuthStore(s => s.profile?.onboarded)
  if (!auth) return <Navigate to="/login" replace />
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function App() {
  useEffect(() => { loadSession() }, [])
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

export default App
