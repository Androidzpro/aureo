import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'

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
    try { setIsLoading(true); setError(''); await reg(data.name, data.email, data.password); navigate('/') }
    catch (e: any) { setError(e?.message || 'Error al crear la cuenta') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-7 h-7 mx-auto mb-4"><img src="/logo.svg" alt="" className="w-full h-full" /></div>
          <h1 className="text-base font-semibold text-[#1A1A1A]">Crear cuenta</h1>
          <p className="text-xs text-[#707070] mt-1">Empieza a controlar tus finanzas</p>
        </div>
        <div className="border border-[#EAEAEA] rounded-lg p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Nombre</label><input placeholder="Tu nombre" className="input" {...register('name')} />{errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}</div>
            <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Correo</label><input type="email" placeholder="tu@email.com" className="input" {...register('email')} />{errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}</div>
            <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Contraseña</label><input type="password" placeholder="Mínimo 6 caracteres" className="input" {...register('password')} />{errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}</div>
            <div><label className="text-[10px] font-medium text-[#707070] uppercase tracking-[0.04em] mb-1.5 block">Confirmar</label><input type="password" placeholder="Repite la contraseña" className="input" {...register('confirmPassword')} />{errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}</div>
            <button type="submit" disabled={isLoading} className="w-full btn-primary h-9">
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Crear cuenta'}
            </button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-xs text-red-600 text-center">{error}</div>}
        </div>
        <p className="text-center text-xs text-[#707070] mt-6">¿Ya tienes cuenta? <Link to="/login" className="text-[#1A1A1A] font-medium hover:underline">Iniciar sesión</Link></p>
      </motion.div>
    </div>
  )
}
