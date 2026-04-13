import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ReceiptText, CalendarDays, CreditCard, Target, BarChart3, Settings,
  LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { cn, playSound } from '@/lib/data'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ReceiptText, label: 'Movimientos', path: '/transactions' },
  { icon: CalendarDays, label: 'Calendario', path: '/calendar' },
  { icon: CreditCard, label: 'Deudas', path: '/debts' },
  { icon: Target, label: 'Metas', path: '/goals' },
  { icon: BarChart3, label: 'Reportes', path: '/reports' },
]

export default function Layout() {
  const location = useLocation()
  const { profile, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#EAEAEA]">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded"><img src="/logo.svg" alt="" className="w-full h-full" /></div>
            <span className="text-sm font-semibold text-[#1A1A1A]">FlowFin</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 hover:bg-[#F5F5F5] rounded-md">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile slide menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-40 bg-black/10" onClick={() => setMobileOpen(false)}>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.2 }}
              className="w-64 h-full bg-white border-r border-[#EAEAEA]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 h-12 border-b border-[#EAEAEA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded"><img src="/logo.svg" alt="" className="w-full h-full" /></div>
                  <span className="text-sm font-semibold">FlowFin</span>
                </div>
                <button onClick={() => setMobileOpen(false)}><X size={16} className="text-[#707070]" /></button>
              </div>
              <nav className="p-2 space-y-0.5">
                <p className="px-3 pt-3 pb-1.5 text-[10px] font-medium text-[#A0A0A0] uppercase tracking-[0.04em]">General</p>
                {navItems.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    className={cn(location.pathname === item.path ? 'sidebar-link-active' : 'sidebar-link')}>
                    <item.icon size={15} /> {item.label}
                  </Link>
                ))}
                <div className="border-t border-[#EAEAEA] my-2" />
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-medium text-[#A0A0A0] uppercase tracking-[0.04em]">Cuenta</p>
                <Link to="/settings" onClick={() => setMobileOpen(false)}
                  className={cn(location.pathname === '/settings' ? 'sidebar-link-active' : 'sidebar-link')}>
                  <Settings size={15} /> Ajustes
                </Link>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar — Linear style */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-[#EAEAEA] flex-col z-50">
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-[#EAEAEA]">
          <div className="w-5 h-5 rounded"><img src="/logo.svg" alt="" className="w-full h-full" /></div>
          <span className="text-sm font-semibold text-[#1A1A1A]">FlowFin</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-medium text-[#A0A0A0] uppercase tracking-[0.04em]">General</p>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} onClick={() => playSound('click')}
              className={cn(location.pathname === item.path ? 'sidebar-link-active' : 'sidebar-link')}>
              <item.icon size={15} /> {item.label}
            </Link>
          ))}
          <div className="border-t border-[#EAEAEA] my-2" />
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-medium text-[#A0A0A0] uppercase tracking-[0.04em]">Cuenta</p>
          <Link to="/settings" onClick={() => playSound('click')}
            className={cn(location.pathname === '/settings' ? 'sidebar-link-active' : 'sidebar-link')}>
            <Settings size={15} /> Ajustes
          </Link>
        </nav>
        <div className="p-2 border-t border-[#EAEAEA]">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-[#F0F0F0] border border-[#EAEAEA] flex items-center justify-center">
              <span className="text-[10px] font-semibold text-[#5C5C5C]">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1A1A1A] truncate">{profile?.full_name}</p>
              <p className="text-[10px] text-[#A0A0A0] truncate">{profile?.email}</p>
            </div>
          </div>
          <button onClick={() => { logout(); playSound('click') }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-[#5C5C5C] hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-[240px] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EAEAEA] z-40">
        <div className="flex justify-around py-1.5">
          {[navItems[0], navItems[1], navItems[3], navItems[5]].map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => playSound('click')}
                className={cn('flex flex-col items-center py-1 px-2 min-w-[56px]', active ? 'text-[#1A1A1A]' : 'text-[#A0A0A0]')}>
                <item.icon size={18} />
                <span className="text-[9px] mt-0.5 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
