import { motion } from 'framer-motion'
import { User, LogOut, Bell, Moon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div><h1 className="text-2xl font-extrabold text-gray-900">Ajustes</h1><p className="text-gray-400 text-sm">Tu cuenta y preferencias</p></div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-black text-xl">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div><p className="font-bold text-gray-900 text-lg">{user?.name}</p><p className="text-sm text-gray-400">{user?.email}</p></div>
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {[
          { icon: Bell, label: 'Notificaciones', desc: 'Alertas de presupuestos y metas', toggle: false },
          { icon: Moon, label: 'Modo oscuro', desc: 'Próximamente', toggle: false },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><item.icon size={18} className="text-gray-500" /></div>
              <div><p className="text-sm font-semibold text-gray-900">{item.label}</p><p className="text-xs text-gray-400">{item.desc}</p></div>
            </div>
            <span className="text-xs text-gray-400">Próximamente</span>
          </div>
        ))}
      </div>

      <Button onClick={logout} className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-semibold h-12 rounded-xl">
        <LogOut size={18} className="mr-2" /> Cerrar sesión
      </Button>

      <div className="text-center">
        <p className="text-xs text-gray-300">FlowFin v2.0</p>
        <p className="text-[10px] text-gray-300">Hecho con ❤️ para tu libertad financiera</p>
      </div>
    </motion.div>
  )
}
