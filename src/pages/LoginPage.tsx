import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({ email: z.string().email('Email inválido'), password: z.string().min(6, 'Mínimo 6 caracteres') })

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
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-8 h-8 mx-auto mb-4"><img src="/logo.svg" alt="" className="w-full h-full" /></div>
          <h1 className="text-lg font-semibold text-[#1A1A1A]">Iniciar sesión</h1>
          <p className="text-sm text-[#707070] mt-1">Ingresa tus credenciales para continuar</p>
        </div>
        <div className="border border-[#EAEAEA] rounded-lg p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Correo electrónico</label>
              <input type="email" placeholder="tu@email.com" className="input" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}</div>
            <div><label className="text-xs font-medium text-[#5C5C5C] mb-1.5 block">Contraseña</label>
              <input type="password" placeholder="••••••••" className="input" {...register('password')} />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}</div>
            <button type="submit" disabled={isLoading} className="w-full btn-primary h-9">
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Iniciar sesión'}
            </button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-xs text-red-600 text-center">{error}</div>}
        </div>
        <p className="text-center text-xs text-[#707070] mt-6">¿No tienes cuenta? <Link to="/register" className="text-[#1A1A1A] font-medium hover:underline">Crear cuenta</Link></p>
      </motion.div>
    </div>
  )
}
