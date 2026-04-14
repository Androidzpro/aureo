import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, ReceiptText, CalendarDays, CreditCard, Target, Settings,
  LogOut, Menu, X, BarChart3, Sun, Moon
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { playSound } from '@/lib/data'
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

  const isActive = (path: string) => location.pathname === path

  const NavItem = ({ item, mobile = false }: { item: typeof mainTabs[0]; mobile?: boolean }) => {
    const active = isActive(item.path)
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => { if (mobile) setMobileMenu(false); playSound('click') }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
        style={{
          background: active ? 'var(--primary-bg)' : 'transparent',
          color: active ? 'var(--primary)' : 'var(--text-secondary)',
        }}
      >
        <item.icon size={18} strokeWidth={active ? 2.5 : 1.5} />
        {item.label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--bg)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[260px] flex-col z-50"
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div className="px-5 h-16 flex items-center" style={{ borderBottom: '1px solid var(--border)' }}>
          <FlowLogo size={28} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>General</p>
          {mainTabs.map(item => <NavItem key={item.path} item={item} />)}

          <div className="pt-4 pb-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Herramientas</p>
            {extraPages.map(item => <NavItem key={item.path} item={item} />)}
          </div>
        </nav>

        {/* User */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
              {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{profile?.name}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{profile?.email}</p>
            </div>
          </div>
          <div className="flex gap-1 px-2 mt-2">
            <button onClick={() => setDark(!dark)} className="btn-icon" title="Modo oscuro">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => { logout(); playSound('click') }} className="btn-icon flex-1" title="Cerrar sesión"
              style={{ color: 'var(--danger)' }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 backdrop-blur-xl"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <FlowLogo size={22} />
          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="btn-icon">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="btn-icon">
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setMobileMenu(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 bottom-0 w-72 overflow-y-auto"
              style={{ background: 'var(--bg-card)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 h-14" style={{ borderBottom: '1px solid var(--border)' }}>
                <FlowLogo size={22} />
                <button onClick={() => setMobileMenu(false)} className="btn-icon"><X size={18} /></button>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {[...mainTabs, ...extraPages].map(item => (
                  <Link key={item.path} to={item.path}
                    onClick={() => { setMobileMenu(false); playSound('click') }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: isActive(item.path) ? 'var(--primary-bg)' : 'transparent',
                      color: isActive(item.path) ? 'var(--primary)' : 'var(--text-secondary)',
                    }}>
                    <item.icon size={18} /> {item.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-[260px]">
        <div className="max-w-2xl mx-auto px-4 py-4 lg:py-6">
          <Outlet />
        </div>
      </main>

      {/* FAB (mobile) */}
      <Link to="/transactions?add=true"
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition-transform lg:hidden shadow-lg"
        style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>

      {/* Bottom Navigation (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl safe-bottom"
        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div className="flex justify-around py-2 max-w-lg mx-auto">
          {mainTabs.map(item => {
            const active = isActive(item.path)
            return (
              <Link key={item.path} to={item.path} onClick={() => playSound('click')}
                className="flex flex-col items-center py-1 px-3 min-w-[56px] rounded-xl transition-all">
                <div className="relative">
                  <item.icon size={22} strokeWidth={active ? 2.5 : 1.5}
                    style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }} />
                  {active && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: 'var(--primary)' }} />}
                </div>
                <span className="text-[10px] mt-0.5 font-semibold"
                  style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
