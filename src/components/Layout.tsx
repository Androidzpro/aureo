import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ReceiptText, CalendarDays, TrendingUp, CreditCard, Target, BarChart3, Settings,
  LogOut, Menu, X, ChevronDown
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
  { icon: Settings, label: 'Ajustes', path: '/settings' },
]

export default function Layout() {
  const location = useLocation()
  const { profile, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-100/50">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/logo.svg" alt="FlowFin" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FlowFin</span>
          </div>
          <button onClick={() => setProfileOpen(!profileOpen)} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <span className="text-xs font-bold text-indigo-600">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </button>
        </div>
        {profileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full right-0 left-0 bg-white border-b border-gray-100 p-4 shadow-lg z-50">
            <p className="font-bold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-400">{profile?.email}</p>
            <button onClick={() => { logout(); setProfileOpen(false) }} className="mt-3 w-full py-2.5 bg-red-50 text-red-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
              <LogOut size={16} /> Cerrar sesión
            </button>
          </motion.div>
        )}
      </header>

      {/* Mobile slide menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="w-72 h-full bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg"><img src="/logo.svg" alt="" className="w-full h-full" /></div>
                  <div><span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FlowFin</span></div>
                </div>
                <button onClick={() => setMobileOpen(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <nav className="px-3 space-y-1">
                {navItems.map(item => {
                  const active = location.pathname === item.path
                  return (
                    <Link key={item.path} to={item.path} onClick={() => { setMobileOpen(false); playSound('click') }}
                      className={cn('flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium',
                        active ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50')}>
                      <item.icon size={20} /> {item.label}
                    </Link>
                  )
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                <button onClick={() => { logout(); playSound('click') }} className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100/50 flex-col z-50">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg"><img src="/logo.svg" alt="" className="w-full h-full" /></div>
            <div><span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FlowFin</span>
              <p className="text-[10px] text-gray-400 -mt-0.5">Tu dinero, tu control</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => playSound('click')}
                className={cn('flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium',
                  active ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50')}>
                <item.icon size={18} /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-600">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
            </div>
          </div>
          <button onClick={() => { logout(); playSound('click') }} className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100/50 z-40">
        <div className="flex justify-around py-2 px-1">
          {[navItems[0], navItems[1], navItems[3], navItems[5]].map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} onClick={() => playSound('click')}
                className={cn('flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors min-w-[56px]',
                  active ? 'text-indigo-600' : 'text-gray-400')}>
                <item.icon size={20} />
                <span className="text-[10px] mt-0.5 font-semibold">{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-indigo-600 mt-0.5" />}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
