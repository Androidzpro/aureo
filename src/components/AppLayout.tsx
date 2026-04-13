import { useState, useEffect, useCallback } from 'react'
import { Outlet, Link, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, ReceiptText, CalendarDays, TrendingUp, Settings, Plus, Wallet, Moon, Sun,
  LogOut, Menu, X, Target, CreditCard, BarChart3
} from 'lucide-react'
import { useAuthStore, loadSession } from '@/store/authStore'
import { cn, playSound } from '@/lib/data'

const tabs = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: ReceiptText, label: 'Movimientos', path: '/transactions' },
  { icon: BarChart3, label: 'Reportes', path: '/reports' },
  { icon: Wallet, label: 'Presupuestos', path: '/budgets' },
  { icon: Settings, label: 'Ajustes', path: '/settings' },
]

const extraPages = [
  { icon: CalendarDays, label: 'Calendario', path: '/calendar' },
  { icon: CreditCard, label: 'Deudas', path: '/debts' },
  { icon: Target, label: 'Metas', path: '/goals' },
]

export default function AppLayout() {
  const location = useLocation()
  const { profile, logout } = useAuthStore()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('flowfin-dark') === 'true'
    return false
  })

  useEffect(() => { loadSession() }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('flowfin-dark', String(dark))
  }, [dark])

  const handleLogout = useCallback(async () => {
    playSound('delete')
    await logout()
  }, [logout])

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0F0F0F] transition-colors duration-300 pb-20 lg:pb-8">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0F0F0F]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">F</span>
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FlowFin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setDark(!dark); playSound('click') }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
              {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-gray-500" />}
            </button>
            <Link to="/settings">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Extra Pages Nav */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          {extraPages.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => playSound('click')}
                className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-xs font-medium',
                  active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700')}>
                <item.icon size={15} /> {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-4">
        <Outlet />
      </main>

      {/* FAB */}
      <Link to="/transactions?add=true"
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-300/50 dark:shadow-indigo-900/50 flex items-center justify-center active:scale-90 transition-transform">
        <Plus size={24} className="text-white" />
      </Link>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0F0F0F]/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
        <div className="flex justify-around py-1.5 max-w-2xl mx-auto">
          {tabs.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => playSound('click')}
                className={cn('flex flex-col items-center py-1.5 px-2 min-w-[56px] rounded-xl transition-all',
                  active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500')}>
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
