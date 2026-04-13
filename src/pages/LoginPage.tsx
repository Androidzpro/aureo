import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
    try { setIsLoading(true); setError(''); await login(data.email, data.password); navigate('/') }
    catch (e: any) { setError(e?.message || 'Error al ingresar') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center">
            <span className="text-4xl">💰</span>
          </div>
          <h1 className="text-2xl font-black text-white">FlowFin</h1>
          <p className="text-white/70 text-sm mt-1">Tu asistente financiero</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Iniciar sesión</h2>
          <p className="text-sm text-gray-400 mb-5">Ingresa tus credenciales</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Correo</label>
              <input type="email" placeholder="tu@email.com" className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Contraseña</label>
              <input type="password" placeholder="••••••••" className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-300/50 active:scale-[0.98] transition-all disabled:opacity-50">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Entrar'}
            </button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-xs text-red-600 text-center">{error}</div>}
          <p className="text-center text-xs text-gray-500 mt-5">
            ¿No tienes cuenta? <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold">Crear cuenta gratis</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
