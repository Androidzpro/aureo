import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, Key, Bell, Moon, Palette, ChevronRight, X, Check, Sun } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { playSound, cn, CURRENCIES } from '@/lib/data'
import { ConfirmDialog } from '@/components/UI'

export default function SettingsPage() {
  const { profile, logout, updatePassword, updateCurrency } = useAuthStore()
  const [dark, setDark] = useState(() => localStorage.getItem('flowfin-dark') === 'true')
  const [showChangePass, setShowChangePass] = useState(false)
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })
  const [passError, setPassError] = useState('')
  const [passSuccess, setPassSuccess] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [showCurrency, setShowCurrency] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('flowfin-dark', String(dark))
  }, [dark])

  const handleChangePassword = async () => {
    try {
      setPassLoading(true); setPassError(''); setPassSuccess('')
      if (passForm.newPass !== passForm.confirm) { setPassError('Las contraseñas no coinciden'); return }
      if (passForm.newPass.length < 8) { setPassError('Mínimo 8 caracteres'); return }
      // With Supabase Auth, we just update the password directly (no need for current)
      await updatePassword(passForm.newPass)
      setPassSuccess('Contraseña actualizada correctamente')
      setPassForm({ current: '', newPass: '', confirm: '' })
      setTimeout(() => setShowChangePass(false), 1500)
    } catch (e: any) { setPassError(e?.message || 'Error al cambiar contraseña') }
    finally { setPassLoading(false) }
  }

  const handleCurrency = async (code: string) => {
    await updateCurrency(code)
    setShowCurrency(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Ajustes</h1><p className="text-xs text-gray-400">Tu cuenta y preferencias</p></div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-300/30">
            <span className="text-white font-bold text-lg">{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile?.name}</p><p className="text-xs text-gray-400 truncate">{profile?.email}</p></div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
        <button onClick={() => setShowChangePass(true)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><Key size={15} className="text-gray-500" /></div><div className="text-left"><p className="text-xs font-medium text-gray-900 dark:text-white">Cambiar contraseña</p><p className="text-[10px] text-gray-400">Actualiza tu contraseña</p></div></div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
        <button onClick={() => setShowCurrency(true)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><span className="text-sm">💱</span></div><div className="text-left"><p className="text-xs font-medium text-gray-900 dark:text-white">Moneda</p><p className="text-[10px] text-gray-400">{profile?.currency || 'MXN'} — {CURRENCIES[profile?.currency || 'MXN']?.symbol}</p></div></div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">{dark ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} className="text-gray-500" />}</div><div><p className="text-xs font-medium text-gray-900 dark:text-white">Modo oscuro</p><p className="text-[10px] text-gray-400">Cambiar tema de la app</p></div></div>
          <button onClick={() => setDark(!dark)} className={cn('relative w-11 h-6 rounded-full transition-colors', dark ? 'bg-blue-600' : 'bg-gray-200')}>
            <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform', dark ? 'translate-x-[22px]' : 'translate-x-0.5')} />
          </button>
        </div>
        {[
          { icon: Bell, label: 'Notificaciones', desc: 'Alertas y recordatorios' },
          { icon: Palette, label: 'Personalizar', desc: 'Colores y apariencia' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><item.icon size={15} className="text-gray-500" /></div><div><p className="text-xs font-medium text-gray-900 dark:text-white">{item.label}</p><p className="text-[10px] text-gray-400">{item.desc}</p></div></div>
            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Próximamente</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={() => setConfirmLogout(true)} className="w-full h-11 bg-red-50 dark:bg-red-900/20 text-red-600 font-medium rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
        <LogOut size={15} /> Cerrar sesión
      </button>

      <div className="text-center"><p className="text-[10px] text-gray-300 dark:text-gray-600">FlowFin v5.0</p></div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePass && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => { setShowChangePass(false); setPassError(''); setPassSuccess('') }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">Cambiar contraseña</h3><button onClick={() => setShowChangePass(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 space-y-4">
                {passSuccess ? (
                  <div className="text-center py-6"><div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3"><Check size={24} className="text-emerald-600" /></div><p className="text-sm font-medium text-emerald-600">{passSuccess}</p></div>
                ) : (
                  <>
                    <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Nueva contraseña</label><input type="password" value={passForm.newPass} onChange={e => setPassForm({...passForm,newPass:e.target.value})} placeholder="Mínimo 6 caracteres" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                    <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Confirmar</label><input type="password" value={passForm.confirm} onChange={e => setPassForm({...passForm,confirm:e.target.value})} placeholder="Repite la contraseña" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                    {passError && <p className="text-xs text-red-500 text-center">{passError}</p>}
                    <div className="flex gap-2"><button onClick={() => setShowChangePass(false)} className="flex-1 h-11 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs">Cancelar</button><button onClick={handleChangePassword} disabled={passLoading} className="flex-1 h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-xs disabled:opacity-50">{passLoading ? 'Guardando...' : 'Guardar'}</button></div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Currency Modal */}
      <AnimatePresence>
        {showCurrency && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowCurrency(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">Seleccionar moneda</h3><button onClick={() => setShowCurrency(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 grid grid-cols-4 gap-2">
                {Object.entries(CURRENCIES).map(([code, c]) => (
                  <button key={code} onClick={() => handleCurrency(code)} className={cn('p-3 rounded-xl text-center', profile?.currency === code ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{c.symbol}</p>
                    <p className="text-[10px] text-gray-400">{code}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={confirmLogout} title="Cerrar sesión" message="¿Estás seguro?" confirmLabel="Salir" onConfirm={async () => { playSound('click'); await logout() }} onCancel={() => setConfirmLogout(false)} />
    </motion.div>
  )
}
