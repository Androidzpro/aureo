import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  Receipt,
  Wallet,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Receipt, label: 'Transactions', path: '/transactions' },
  { icon: Wallet, label: 'Budgets', path: '/budgets' },
  { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function Layout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-aureo">Aureo</span>
            <span className="text-xl">✨</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-accent"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-40 bg-background pt-20"
        >
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-aureo text-white'
                      : 'hover:bg-accent'
                  )}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </motion.div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-card border-r flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-aureo">Aureo</span>
            <span className="text-2xl">✨</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-aureo text-white'
                    : 'hover:bg-accent'
                )}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="mb-3">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-20 lg:pt-0">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors',
                  isActive ? 'text-aureo' : 'text-muted-foreground'
                )}
              >
                <item.icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
