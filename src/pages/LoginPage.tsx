import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      setIsLoading(true); setError('')
      await login(data.email, data.password)
      navigate('/')
    } catch (e: any) { setError(e?.message || 'Error al ingresar') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-indigo-200 mx-auto mb-4">
            <img src="/logo.svg" alt="FlowFin" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">FlowFin</h1>
          <p className="text-gray-400 text-sm mt-1">Bienvenido de vuelta</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/50 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tu@email.com" className="mt-1.5" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full gradient-primary text-white font-semibold h-12 rounded-xl shadow-lg shadow-indigo-200" disabled={isLoading}>
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Iniciar sesión'}
            </Button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">{error}</div>}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          ¿No tienes cuenta? <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">Crear cuenta</Link>
        </p>
      </motion.div>
    </div>
  )
}
