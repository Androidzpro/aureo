import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, ReceiptText, CalendarDays, TrendingUp, Settings, Plus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/data'

const tabs = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: ReceiptText, label: 'Movimientos', path: '/transactions' },
  { icon: CalendarDays, label: 'Calendario', path: '/calendar' },
  { icon: TrendingUp, label: 'Reportes', path: '/reports' },
  { icon: Settings, label: 'Ajustes', path: '/settings' },
]

export default function AppLayout() {
  const location = useLocation()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-white dark:bg-[#111] pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#111]/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Bienvenido</p>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white">{user?.name || 'Usuario'}</h1>
          </div>
          <Link to="/settings">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#111]/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 safe-bottom">
        <div className="flex justify-around py-1.5 px-2 max-w-lg mx-auto">
          {tabs.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
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

      {/* FAB - Floating Action Button */}
      <Link to="/transactions?add=true"
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-300/50 dark:shadow-indigo-900/50 flex items-center justify-center active:scale-90 transition-transform">
        <Plus size={24} className="text-white" />
      </Link>
    </div>
  )
}
