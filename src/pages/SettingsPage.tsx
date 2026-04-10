import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { User, LogOut, CreditCard, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu cuenta y preferencias</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User size={20} /> Perfil</CardTitle>
          <CardDescription>Tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><label className="text-sm font-medium text-gray-500">Nombre</label><p className="text-lg font-medium">{user?.name}</p></div>
          <div><label className="text-sm font-medium text-gray-500">Email</label><p className="text-lg font-medium">{user?.email}</p></div>
          <div><label className="text-sm font-medium text-gray-500">Miembro desde</label><p className="text-lg font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Reciente'}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings size={20} /> Sesión</CardTitle>
          <CardDescription>Gestiona tu acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout} className="w-full"><LogOut size={18} className="mr-2" />Cerrar sesión</Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
