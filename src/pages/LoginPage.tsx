import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { FlowLogo } from '@/components/FlowLogo'
import { Eye, EyeOff, Loader2, AlertCircle, Check, Mail } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setError('')
      await login(data.email, data.password)
      navigate('/')
    } catch (e: any) {
      if (e?.message?.includes('Invalid login')) {
        setError('Correo o contraseña incorrectos')
      } else if (e?.message?.includes('Email not confirmed')) {
        setError('Revisa tu correo para confirmar tu cuenta')
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    if (!resetEmail || !z.string().email().safeParse(resetEmail).success) return
    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError(error.message)
      else setResetSent(true)
    } catch (e: any) {
      setError('Error al enviar el correo')
    } finally {
      setResetLoading(false)
    }
  }

  // Forgot password modal
  if (showReset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <FlowLogo size={32} className="justify-center" theme="light" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            {resetSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Enviamos un enlace para restablecer tu contraseña a <strong>{resetEmail}</strong>
                </p>
                <button onClick={() => { setShowReset(false); setResetSent(false) }} className="btn-secondary w-full">
                  Volver al login
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={24} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Recuperar contraseña</h2>
                  <p className="text-sm text-gray-500">Ingresa tu correo y te enviaremos un enlace para restablecerla</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Correo electrónico</label>
                    <input
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      type="email"
                      placeholder="tu@email.com"
                      className="input"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}
                  <button onClick={handleReset} disabled={resetLoading || !resetEmail} className="btn-primary w-full">
                    {resetLoading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : 'Enviar enlace'}
                  </button>
                  <button onClick={() => setShowReset(false)} className="btn-ghost w-full">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md text-center">
          <FlowLogo size={48} variant="full" theme="light" className="justify-center mb-8" />
          <h1 className="text-4xl font-bold text-white mb-4">Tu dinero, bajo control</h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Gestiona tus finanzas con inteligencia. FlowFin te ayuda a tomar mejores decisiones con tu dinero.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Seguro</div>
            <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Gratuito</div>
            <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Inteligente</div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <FlowLogo size={36} className="justify-center" theme="light" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
              <p className="text-sm text-gray-500 mt-1">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Correo electrónico</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className={cn('input', errors.email && 'border-red-300 focus:border-red-500 focus:ring-red-500/20')}
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">Contraseña</label>
                  <button type="button" onClick={() => setShowReset(true)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input pr-12"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600 mt-1.5">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Iniciando sesión...</> : 'Iniciar sesión'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Crear cuenta gratis
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Al continuar, aceptas nuestros Términos de servicio y Política de privacidad
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
