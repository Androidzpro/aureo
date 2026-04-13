import { motion } from 'framer-motion'
import { User, LogOut, Bell, Moon, Palette } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { playSound } from '@/lib/data'

export default function SettingsPage() {
  const { profile, logout } = useAuthStore()
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <div className="mb-6"><h1 className="text-xl font-semibold text-[#1A1A1A] tracking-tight">Ajustes</h1><p className="text-xs text-[#707070] mt-0.5">Tu cuenta y preferencias</p></div>
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F0F0F0] border border-[#EAEAEA] flex items-center justify-center">
            <span className="text-sm font-semibold text-[#5C5C5C]">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div><p className="text-sm font-medium text-[#1A1A1A]">{profile?.full_name}</p><p className="text-xs text-[#A0A0A0]">{profile?.email}</p></div>
        </div>
      </div>
      <div className="card overflow-hidden mb-4">
        {[
          { icon: Bell, label: 'Notificaciones', desc: 'Alertas de presupuestos y metas' },
          { icon: Moon, label: 'Modo oscuro', desc: 'Próximamente' },
          { icon: Palette, label: 'Personalizar', desc: 'Colores y apariencia' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0] last:border-0">
            <div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-md bg-[#F5F5F5] flex items-center justify-center"><item.icon size={14} className="text-[#707070]" /></div><div><p className="text-xs font-medium text-[#1A1A1A]">{item.label}</p><p className="text-[10px] text-[#A0A0A0]">{item.desc}</p></div></div>
            <span className="text-[10px] text-[#A0A0A0] bg-[#F5F5F5] px-2 py-0.5 rounded">Próximamente</span>
          </div>
        ))}
      </div>
      <button onClick={() => { logout(); playSound('click') }} className="btn-danger w-full flex items-center justify-center gap-2"><LogOut size={14} /> Cerrar sesión</button>
      <div className="text-center mt-6"><p className="text-[10px] text-[#D4D4D4]">FlowFin v3.0</p></div>
    </motion.div>
  )
}
