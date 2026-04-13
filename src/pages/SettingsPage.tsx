import { motion } from 'framer-motion'
import { User, LogOut, Bell, Moon, Palette } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { playSound } from '@/lib/data'

export default function SettingsPage() {
  const { profile, logout } = useAuthStore()
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div><h1 className="text-2xl font-extrabold text-gray-900">Ajustes ⚙️</h1><p className="text-gray-400 text-sm">Tu cuenta y preferencias</p></div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-black text-xl">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div><p className="font-bold text-gray-900 text-lg">{profile?.full_name}</p><p className="text-sm text-gray-400">{profile?.email}</p></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {[
          { icon: Bell, label: 'Notificaciones', desc: 'Alertas de presupuestos y metas', badge: 'Próximamente' },
          { icon: Moon, label: 'Modo oscuro', desc: 'Cambia el tema de la app', badge: 'Próximamente' },
          { icon: Palette, label: 'Personalizar', desc: 'Colores y apariencia', badge: 'Próximamente' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50/50 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><item.icon size={18} className="text-gray-500" /></div>
              <div><p className="text-sm font-semibold text-gray-900">{item.label}</p><p className="text-xs text-gray-400">{item.desc}</p></div>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{item.badge}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { logout(); playSound('click') }} className="w-full bg-red-50 text-red-600 font-semibold h-12 rounded-xl border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
        <LogOut size={18} /> Cerrar sesión
      </button>
      <div className="text-center"><p className="text-xs text-gray-300">FlowFin v3.0</p><p className="text-[10px] text-gray-300">Hecho con ❤️ para tu libertad financiera</p></div>
    </motion.div>
  )
}
