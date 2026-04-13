import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { playSound } from '@/lib/data'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'No coinciden', path: ['confirmPassword'] })

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: reg } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data: { name: string; email: string; password: string }) => {
    try { setIsLoading(true); setError(''); await reg(data.name, data.email, data.password); playSound('success'); navigate('/') }
    catch (e: any) { setError(e?.message || 'Error al crear la cuenta') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4">
            <img src="/logo.svg" alt="FlowFin" className="w-full h-full drop-shadow-2xl" />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-white">Crear cuenta</h1>
          <p className="text-gray-400 text-sm mt-1">Empieza a controlar tus finanzas</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Nombre</label>
              <input placeholder="Tu nombre"
                className="w-full h-11 bg-white/10 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                {...register('name')} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Correo</label>
              <input type="email" placeholder="tu@email.com"
                className="w-full h-11 bg-white/10 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                {...register('email')} />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Contraseña</label>
              <input type="password" placeholder="Mínimo 6 caracteres"
                className="w-full h-11 bg-white/10 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                {...register('password')} />
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Confirmar</label>
              <input type="password" placeholder="Repite la contraseña"
                className="w-full h-11 bg-white/10 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 active:scale-[0.98]">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Crear cuenta'}
            </button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center">{error}</div>}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta? <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300">Iniciar sesión</Link>
        </p>
      </motion.div>
    </div>
  )
}
