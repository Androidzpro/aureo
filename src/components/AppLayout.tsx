import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, ReceiptText, CalendarDays, CreditCard, Target, Settings,
  LogOut, Menu, X, BarChart3, Sun, Moon
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn, playSound } from '@/lib/data'
import { FlowLogo } from '@/components/FlowLogo'

const mainTabs = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: ReceiptText, label: 'Movimientos', path: '/transactions' },
  { icon: BarChart3, label: 'Reportes', path: '/reports' },
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
  const [dark, setDark] = useState(() => localStorage.getItem('flowfin-dark') === 'true')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('flowfin-dark', String(dark))
  }, [dark])

  return (
    <div className="min-h-screen bg-[var(--gray-50)] dark:bg-[var(--gray-950)] transition-colors duration-300 pb-20 lg:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[var(--gray-900)] border-r border-[var(--gray-100)] dark:border-[var(--gray-800)] flex-col z-50">
        {/* Logo */}
        <div className="px-5 h-14 flex items-center border-b border-[var(--gray-100)] dark:border-[var(--gray-800)]">
          <FlowLogo size={24} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold text-[var(--gray-400)] dark:text-[var(--gray-600)] uppercase tracking-wider mb-2">General</p>
          {mainTabs.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => playSound('click')}
                className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-[var(--flow-brand-50)] dark:bg-indigo-950/30 text-[var(--flow-brand-600)] dark:text-indigo-400'
                    : 'text-[var(--gray-600)] dark:text-[var(--gray-400)] hover:bg-[var(--gray-50)] dark:hover:bg-[var(--gray-800)] hover:text-[var(--gray-900)] dark:hover:text-[var(--gray-200)]')}>
                <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
                {item.label}
              </Link>
            )
          })}

          <div className="pt-4 pb-2">
            <p className="px-3 text-[10px] font-semibold text-[var(--gray-400)] dark:text-[var(--gray-600)] uppercase tracking-wider mb-2">Herramientas</p>
            {extraPages.map(item => {
              const active = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path} onClick={() => playSound('click')}
                  className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-[var(--flow-brand-50)] dark:bg-indigo-950/30 text-[var(--flow-brand-600)] dark:text-indigo-400'
                      : 'text-[var(--gray-600)] dark:text-[var(--gray-400)] hover:bg-[var(--gray-50)] dark:hover:bg-[var(--gray-800)] hover:text-[var(--gray-900)] dark:hover:text-[var(--gray-200)]')}>
                  <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-[var(--gray-100)] dark:border-[var(--gray-800)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--gray-900)] dark:text-white truncate">{profile?.name}</p>
              <p className="text-[10px] text-[var(--gray-400)] truncate">{profile?.email}</p>
            </div>
          </div>
          <button onClick={() => { logout(); playSound('click') }}
            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-xs font-medium text-[var(--gray-500)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-[var(--gray-900)]/80 backdrop-blur-xl border-b border-[var(--gray-100)] dark:border-[var(--gray-800)]">
        <div className="flex items-center justify-between px-4 h-14">
          <FlowLogo size={22} />
          <div className="flex items-center gap-2">
            <button onClick={() => { setDark(!dark); playSound('click') }} className="p-2 rounded-lg hover:bg-[var(--gray-100)] dark:hover:bg-[var(--gray-800)] transition-colors">
              {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-[var(--gray-500)]" />}
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 rounded-lg hover:bg-[var(--gray-100)] dark:hover:bg-[var(--gray-800)] transition-colors">
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenu(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-[var(--gray-900)] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--gray-100)] dark:border-[var(--gray-800)]">
                <FlowLogo size={22} />
                <button onClick={() => setMobileMenu(false)} className="p-2 rounded-lg hover:bg-[var(--gray-100)] dark:hover:bg-[var(--gray-800)]"><X size={18} /></button>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {[...mainTabs, ...extraPages].map(item => {
                  const active = location.pathname === item.path
                  return (
                    <Link key={item.path} to={item.path} onClick={() => { setMobileMenu(false); playSound('click') }}
                      className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                        active ? 'bg-[var(--flow-brand-50)] dark:bg-indigo-950/30 text-[var(--flow-brand-600)] dark:text-indigo-400' : 'text-[var(--gray-600)] dark:text-[var(--gray-400)]')}>
                      <item.icon size={18} /> {item.label}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-64">
        <div className="max-w-2xl mx-auto px-4 py-4 lg:py-6">
          <Outlet />
        </div>
      </main>

      {/* FAB */}
      <Link to="/transactions?add=true"
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-90 transition-transform lg:hidden">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </Link>

      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[var(--gray-900)]/90 backdrop-blur-xl border-t border-[var(--gray-100)] dark:border-[var(--gray-800)] safe-bottom">
        <div className="flex justify-around py-1.5 max-w-lg mx-auto">
          {mainTabs.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => playSound('click')}
                className={cn('flex flex-col items-center py-1.5 px-3 min-w-[56px] rounded-xl transition-all',
                  active ? 'text-[var(--flow-brand-600)] dark:text-indigo-400' : 'text-[var(--gray-400)] dark:text-[var(--gray-600)]')}>
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-[var(--flow-brand-500)] dark:bg-indigo-400 mt-0.5" />}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
