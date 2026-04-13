import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/data'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'No coinciden', path: ['confirmPassword'] })

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register: reg } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setVerificationSent(true)
    }
  }, [searchParams])

  const onSubmit = async (data: { name: string; email: string; password: string }) => {
    try {
      setIsLoading(true); setError(''); setVerificationSent(false)
      const result = await reg(data.name, data.email, data.password)
      if (result === 'needsVerification') {
        setVerificationSent(true)
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setVerificationSent(true)
        return
      }
      navigate('/onboarding')
    }
    catch (e: any) { 
      if (e?.message?.includes('ya está registrado')) {
        setError(e.message)
      } else {
        setError(e?.message || 'Error al crear cuenta')
      }
    }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center"><span className="text-3xl">💰</span></div>
          <h1 className="text-xl font-black text-white">Crear cuenta</h1>
          <p className="text-white/70 text-sm mt-1">Empieza a controlar tus finanzas</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Nombre</label><input placeholder="Tu nombre" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" {...register('name')} />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}</div>
            <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Correo</label><input type="email" placeholder="tu@email.com" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" {...register('email')} />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}</div>
            <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Contraseña</label><input type="password" placeholder="Mínimo 6 caracteres" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" {...register('password')} />{errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}</div>
            <div><label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Confirmar</label><input type="password" placeholder="Repite la contraseña" className="w-full h-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" {...register('confirmPassword')} />{errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}</div>
            <button type="submit" disabled={isLoading} className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-300/50 active:scale-[0.98] transition-all disabled:opacity-50">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Crear cuenta'}
            </button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-xs text-red-600 text-center">{error}</div>}
          {verificationSent && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
              <p className="text-xs text-emerald-600 text-center font-medium">Revisa tu correo</p>
              <p className="text-xs text-emerald-500 text-center mt-1">Te enviamos un enlace de verificación. Haz clic en el enlace para activar tu cuenta.</p>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-white/60 mt-5">¿Ya tienes cuenta? <Link to="/login" className="text-white font-semibold">Iniciar sesión</Link></p>
      </motion.div>
    </div>
  )
}
