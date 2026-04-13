import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, Key, X, Bell, Moon, Palette, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { playSound, cn } from '@/lib/data'

export default function SettingsPage() {
  const { user, logout, changePassword } = useAuthStore()
  const [showChangePass, setShowChangePass] = useState(false)
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })
  const [passError, setPassError] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [passSuccess, setPassSuccess] = useState('')

  const handleChangePassword = async () => {
    try {
      setPassLoading(true); setPassError(''); setPassSuccess('')
      if (passForm.newPass !== passForm.confirm) { setPassError('Las contraseñas no coinciden'); return }
      if (passForm.newPass.length < 6) { setPassError('Mínimo 6 caracteres'); return }
      await changePassword(passForm.current, passForm.newPass)
      setPassSuccess('Contraseña actualizada correctamente')
      setPassForm({ current: '', newPass: '', confirm: '' })
      setTimeout(() => setShowChangePass(false), 1500)
    } catch (e: any) { setPassError(e?.message || 'Error al cambiar contraseña') }
    finally { setPassLoading(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8">
      <div><h1 className="text-lg font-bold text-gray-900 dark:text-white">Ajustes</h1><p className="text-xs text-gray-400">Tu cuenta y preferencias</p></div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-300/30">
            <span className="text-white font-bold text-lg">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p><p className="text-xs text-gray-400 truncate">{user?.email}</p></div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
        <button onClick={() => setShowChangePass(true)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><Key size={15} className="text-gray-500" /></div><div className="text-left"><p className="text-xs font-medium text-gray-900 dark:text-white">Cambiar contraseña</p><p className="text-[10px] text-gray-400">Actualiza tu contraseña de acceso</p></div></div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
        {[
          { icon: Bell, label: 'Notificaciones', desc: 'Alertas y recordatorios' },
          { icon: Moon, label: 'Modo oscuro', desc: 'Próximamente' },
          { icon: Palette, label: 'Personalizar', desc: 'Colores y apariencia' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><item.icon size={15} className="text-gray-500" /></div><div><p className="text-xs font-medium text-gray-900 dark:text-white">{item.label}</p><p className="text-[10px] text-gray-400">{item.desc}</p></div></div>
            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Próximamente</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={() => { logout(); playSound('click') }} className="w-full h-11 bg-red-50 dark:bg-red-900/20 text-red-600 font-medium rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
        <LogOut size={15} /> Cerrar sesión
      </button>

      <div className="text-center"><p className="text-[10px] text-gray-300 dark:text-gray-600">FlowFin v4.0</p></div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePass && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => { setShowChangePass(false); setPassError(''); setPassSuccess('') }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="bg-white dark:bg-[#1A1A1A] rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800"><h3 className="text-sm font-bold text-gray-900 dark:text-white">Cambiar contraseña</h3><button onClick={() => setShowChangePass(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><X size={16} className="text-gray-400" /></button></div>
              <div className="p-5 space-y-4">
                {passSuccess ? (
                  <div className="text-center py-6"><p className="text-3xl mb-2">✅</p><p className="text-sm font-medium text-emerald-600">{passSuccess}</p></div>
                ) : (
                  <>
                    <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Contraseña actual</label><input type="password" value={passForm.current} onChange={e => setPassForm({...passForm,current:e.target.value})} placeholder="••••••••" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                    <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Nueva contraseña</label><input type="password" value={passForm.newPass} onChange={e => setPassForm({...passForm,newPass:e.target.value})} placeholder="Mínimo 6 caracteres" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                    <div><label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">Confirmar nueva</label><input type="password" value={passForm.confirm} onChange={e => setPassForm({...passForm,confirm:e.target.value})} placeholder="Repite la contraseña" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500" /></div>
                    {passError && <p className="text-xs text-red-500 text-center">{passError}</p>}
                    <div className="flex gap-2"><button onClick={() => setShowChangePass(false)} className="flex-1 h-11 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs">Cancelar</button><button onClick={handleChangePassword} disabled={passLoading} className="flex-1 h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl text-xs disabled:opacity-50">{passLoading ? 'Guardando...' : 'Guardar'}</button></div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
